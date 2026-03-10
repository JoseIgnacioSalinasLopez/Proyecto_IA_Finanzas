import { GoogleGenerativeAI } from '@google/generative-ai';
import * as statsService from '../services/stats.service.js';
import * as transactionService from '../services/transaction.service.js';
import { supabase } from '../config/supabaseClient.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chat = async (req, res, next) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
        }

        // ========================================================
        // PARTE 1: ESTADÍSTICAS INTACTAS
        // ========================================================
        const stats = await statsService.getStats(userId);

        const topCategory = stats?.expensesByCategory?.[0];
        const savingsRate = stats?.summary?.totalIncome > 0
            ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1)
            : 0;

        // ========================================================
        // PARTE 2: PROMPT DINÁMICO (Soporta Ingresos y Gastos)
        // ========================================================
        const systemPrompt = `
Eres un asistente financiero personal llamado "Asistente IA" de la app MenteBillete.
Debes responder SIEMPRE en español, de forma amigable, clara y concisa (máximo 3 frases).
Usa formato de moneda como: $1,200.00.
NUNCA inventes datos. Solo usa los datos reales del usuario que se proporcionan abajo.

DATOS FINANCIEROS REALES DEL USUARIO:
- Balance neto: $${stats?.summary?.balance?.toFixed(2) || 0}
- Ingresos totales: $${stats?.summary?.totalIncome?.toFixed(2) || 0}
- Gastos totales: $${stats?.summary?.totalExpense?.toFixed(2) || 0}
- Tasa de ahorro: ${savingsRate}%
- Categoría con más gastos: ${topCategory ? `${topCategory.name} ($${topCategory.amount?.toFixed(2)})` : 'No hay datos'}
- Gastos por categoría: ${stats?.expensesByCategory?.map(c => `${c.name}: $${c.amount?.toFixed(2)}`).join(', ') || 'Sin datos'}
- Tasa de gasto diario segura: $${stats?.summary?.dailyBurnRate?.toFixed(2) || 0} por día
- Días de buffer: ${stats?.summary?.bufferTime || 0} días

INSTRUCCIONES DE FORMATO ESTRICTO:
Analiza el mensaje y responde ÚNICAMENTE con un objeto JSON válido. NO uses markdown.

REGLA 1 - REGISTRO DE MOVIMIENTO:
Si el usuario reporta un GASTO (ej. "gasté 200") o un INGRESO (ej. "me pagaron 1000"):
{
  "intent": "registrar_movimiento",
  "type": "expense", // Usa "expense" si es gasto, o "income" si es ingreso
  "amount": <numero_extraido>,
  "category": "<categoria_sugerida_una_palabra>",
  "description": "<descripcion_corta>",
  "reply": "<Tu mensaje confirmando el registro y dando un breve consejo>"
}

REGLA 2 - CONVERSACIÓN GENERAL:
Si el usuario hace preguntas o charla normal:
{
  "intent": "conversacion",
  "reply": "<Tu respuesta amigable basada en sus DATOS FINANCIEROS>"
}
`;

        // ========================================================
        // PARTE 3: EJECUCIÓN CON IA
        // ========================================================
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(`Pregunta del usuario: ${message}`);

        // Limpieza de seguridad: Quitamos posibles etiquetas markdown de código que rompan el JSON
        const rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(rawText);

        // ========================================================
        // PARTE 4: LÓGICA DE INSERCIÓN INTELIGENTE
        // ========================================================
        if (aiResponse.intent === "registrar_movimiento") {
            let finalCategoryId = null;

            const { data: existingCategory } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', userId)
                .ilike('name', aiResponse.category)
                .maybeSingle();

            if (existingCategory) {
                finalCategoryId = existingCategory.id;
            } else {
                const { data: newCategory } = await supabase
                    .from('categories')
                    .insert([{
                        user_id: userId,
                        name: aiResponse.category.toLowerCase(),
                        type: aiResponse.type, // La IA decide si la categoría es de ingreso o gasto
                        color: aiResponse.type === 'income' ? '#34d399' : '#00D4FF' // Verde para ingresos, Cyan para gastos
                    }])
                    .select()
                    .single();

                if (newCategory) finalCategoryId = newCategory.id;
            }

            // Inserción final usando el type dinámico de la IA
            await transactionService.createTransaction(userId, {
                amount: Number(aiResponse.amount),
                type: aiResponse.type, // "income" o "expense"
                category_id: finalCategoryId,
                description: aiResponse.description || `Registro vía IA: ${aiResponse.category}`,
                date: new Date().toISOString()
            });
        }

        res.status(200).json({ success: true, reply: aiResponse.reply });

    } catch (error) {
        console.error('Gemini AI error:', error.message);
        next(error);
    }
};