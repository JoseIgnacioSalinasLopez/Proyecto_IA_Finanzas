import { GoogleGenerativeAI } from '@google/generative-ai';
import * as statsService from '../services/stats.service.js';
import * as transactionService from '../services/transaction.service.js';
import { supabase } from '../config/supabaseClient.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('chat_messages')
            .select('role, content, session_id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const chat = async (req, res, next) => {
    try {
        const { message, sessionId = 'principal' } = req.body;
        const userId = req.user.id;

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
        }

        // 1. Guardar mensaje del usuario
        await supabase.from('chat_messages').insert([{ user_id: userId, role: 'user', content: message, session_id: sessionId }]);

        // 2. Extraer contexto financiero
        const stats = await statsService.getStats(userId);
        const topCategory = stats?.expensesByCategory?.[0];
        const savingsRate = stats?.summary?.totalIncome > 0
            ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1) : 0;

        // Cálculo de días restantes del mes para el Simulador
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeftInMonth = lastDay.getDate() - today.getDate() + 1;

        // 3. EL NUEVO CEREBRO DE LA IA (Prompt Estructurado y Neutral)
        const systemPrompt = `
Eres el Asistente IA de MenteBillete. Tu misión es explicar las finanzas de forma tan sencilla, casual y amigable que hasta un niño o un adulto mayor puedan entenderlo sin dudar.

TUS 10 REGLAS DE ORO DE COMUNICACIÓN:
1. Divide la información usando títulos claros.
2. Usa listas con viñetas (-) o pasos numerados (1, 2) casi siempre.
3. Mantén un tono simple, cálido y muy casual.
4. Evita lenguaje técnico financiero. Si necesitas usar un término financiero, explícalo inmediatamente con palabras simples.
5. Explica las ideas con "peras y manzanas", como si se lo contaras a un amigo que no sabe nada del tema.
6. Prioriza lo más importante en las primeras líneas.
7. Párrafos muy cortos (máximo 5 líneas).
8. Si das recomendaciones, DEBES crear una sección llamada "**Qué puedes hacer:**".
9. Si explicas un proceso, hazlo paso a pasito.
10. Termina siempre con un pequeño resumen o consejo motivador.

DATOS FINANCIEROS DEL USUARIO:
- Balance neto: $${stats?.summary?.balance?.toFixed(2) || 0}
- Ingresos: $${stats?.summary?.totalIncome?.toFixed(2) || 0} | Gastos: $${stats?.summary?.totalExpense?.toFixed(2) || 0}
- Categoría con más gastos: ${topCategory ? `${topCategory.name}` : 'N/A'}
- Presupuesto diario seguro actual: $${stats?.summary?.dailyBurnRate?.toFixed(2) || 0}
- Días restantes del mes: ${daysLeftInMonth}

INSTRUCCIONES DE OPERACIÓN (Devuelve SOLO un JSON válido):

REGLA A: REGISTRO RÁPIDO Y MOTOR FISCAL (Gastos o Ingresos)
Si el usuario registra un gasto, responde con un mensaje corto y amigable confirmando el registro. Si es un gasto médico o escolar, agrega un consejo súper sencillo recomendando pedir factura porque el SAT le puede devolver dinero.
Formato JSON esperado: { "intent": "registrar_movimiento", "type": "expense", "amount": 100, "category": "comida", "reply": "Tu mensaje" }

REGLA B: RESPUESTAS DETALLADAS (Simulador, Inversiones, Dudas y Gastos Hormiga)
Para cualquier consulta, análisis o simulación, DEBES estructurar el campo "reply" en formato Markdown siguiendo EXACTAMENTE esta plantilla ideal:

**[Título corto y amigable del tema]**

[Breve explicación en 1 o 2 líneas fáciles de leer].

**Lo que está pasando:**
- [Punto 1 sencillo]
- [Punto 2 sencillo]

**Qué puedes hacer:**
1. [Paso o recomendación 1]
2. [Paso o recomendación 2]

[Consejo final cálido o resumen motivador].

Formato JSON esperado: { "intent": "conversacion", "reply": "Tu mensaje estructurado con la plantilla ideal en Markdown" }
`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(`Mensaje del usuario: ${message}`);
        const rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(rawText);

        if (aiResponse.intent === "registrar_movimiento") {
            let finalCategoryId = null;

            const { data: existingCategory } = await supabase
                .from('categories').select('id').eq('user_id', userId).ilike('name', aiResponse.category).maybeSingle();

            if (existingCategory) {
                finalCategoryId = existingCategory.id;
            } else {
                const { data: newCategory } = await supabase
                    .from('categories').insert([{
                        user_id: userId, name: aiResponse.category.toLowerCase(),
                        type: aiResponse.type, color: aiResponse.type === 'income' ? '#34d399' : '#00D4FF'
                    }]).select().single();

                if (newCategory) finalCategoryId = newCategory.id;
            }

            await transactionService.createTransaction(userId, {
                amount: Number(aiResponse.amount), type: aiResponse.type,
                category_id: finalCategoryId, description: `Registro vía IA: ${aiResponse.category}`,
                date: new Date().toISOString()
            });
        }

        // 4. Guardar respuesta de la IA
        await supabase.from('chat_messages').insert([{ user_id: userId, role: 'assistant', content: aiResponse.reply, session_id: sessionId }]);

        res.status(200).json({ success: true, reply: aiResponse.reply });

    } catch (error) {
        console.error('Gemini AI error:', error.message);
        next(error);
    }
};

export const clearHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const sessionId = req.query.sessionId;

        let query = supabase.from('chat_messages').delete().eq('user_id', userId);
        if (sessionId) {
            query = query.eq('session_id', sessionId);
        }

        const { error } = await query;
        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, message: 'Historial eliminado' });
    } catch (error) {
        next(error);
    }
};