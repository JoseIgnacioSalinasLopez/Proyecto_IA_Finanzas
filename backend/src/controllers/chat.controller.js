import { GoogleGenerativeAI } from '@google/generative-ai';
import * as statsService from '../services/stats.service.js';
import * as transactionService from '../services/transaction.service.js';
import { supabase } from '../config/supabaseClient.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// NUEVA FUNCIÓN: Extrae el historial cuando React carga la página
export const getHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('chat_messages')
            .select('role, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// TU FUNCIÓN INTACTA (Solo con 2 líneas nuevas para guardar en Supabase)
export const chat = async (req, res, next) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
        }

        // GUARDAR MENSAJE DEL USUARIO EN LA BD (Nuevo)
        await supabase.from('chat_messages').insert([{ user_id: userId, role: 'user', content: message }]);

        const stats = await statsService.getStats(userId);
        const topCategory = stats?.expensesByCategory?.[0];
        const savingsRate = stats?.summary?.totalIncome > 0
            ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1) : 0;

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
- Tasa de gasto diario segura: $${stats?.summary?.dailyBurnRate?.toFixed(2) || 0} por día
- Días de buffer: ${stats?.summary?.bufferTime || 0} días

INSTRUCCIONES DE FORMATO ESTRICTO:
Analiza el mensaje y responde ÚNICAMENTE con un objeto JSON válido. NO uses markdown.

REGLA 1 - REGISTRO DE MOVIMIENTO:
Si el usuario reporta un GASTO (ej. "gasté 200") o un INGRESO (ej. "me pagaron 1000"):
{
  "intent": "registrar_movimiento",
  "type": "expense", 
  "amount": <numero_extraido>,
  "category": "<categoria_sugerida_una_palabra>",
  "description": "<descripcion_corta>",
  "reply": "<Tu mensaje confirmando el registro>"
}

REGLA 2 - CONVERSACIÓN GENERAL:
Si el usuario hace preguntas o charla normal:
{
  "intent": "conversacion",
  "reply": "<Tu respuesta amigable basada en sus DATOS FINANCIEROS>"
}
`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(`Pregunta del usuario: ${message}`);
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
                category_id: finalCategoryId, description: aiResponse.description || `Registro vía IA: ${aiResponse.category}`,
                date: new Date().toISOString()
            });
        }

        // GUARDAR RESPUESTA DE LA IA EN LA BD (Nuevo)
        await supabase.from('chat_messages').insert([{ user_id: userId, role: 'assistant', content: aiResponse.reply }]);

        res.status(200).json({ success: true, reply: aiResponse.reply });

    } catch (error) {
        console.error('Gemini AI error:', error.message);
        next(error);
    }
};