import { GoogleGenerativeAI } from '@google/generative-ai';
import * as statsService from '../services/stats.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chat = async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
        }

        // 1. RAG: Fetch the user's real financial data as context
        const stats = await statsService.getStats(req.user.id);

        const topCategory = stats.expensesByCategory?.[0];
        const savingsRate = stats.summary.totalIncome > 0
            ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1)
            : 0;

        const ragContext = `
Eres un asistente financiero personal llamado "Asistente IA" de la app MenteBillete.
Debes responder SIEMPRE en español, de forma amigable, clara y concisa (máximo 3 frases).
Usa formato de moneda como: $1,200.00 (sin especificar la divisa exacta).
NUNCA inventes datos. Solo usa los datos reales del usuario que se proporcionan abajo.

DATOS FINANCIEROS REALES DEL USUARIO (al día de hoy):
- Balance neto: $${stats.summary.balance?.toFixed(2)}
- Ingresos totales: $${stats.summary.totalIncome?.toFixed(2)}
- Gastos totales: $${stats.summary.totalExpense?.toFixed(2)}
- Tasa de ahorro: ${savingsRate}%
- Categoría con más gastos: ${topCategory ? `${topCategory.name} ($${topCategory.amount?.toFixed(2)})` : 'No hay datos'}
- Gastos por categoría: ${stats.expensesByCategory?.map(c => `${c.name}: $${c.amount?.toFixed(2)}`).join(', ') || 'Sin datos'}
- Tasa de gasto diario segura: $${stats.summary.dailyBurnRate?.toFixed(2)} por día
- Días de buffer (ahorros disponibles vs gastos): ${stats.summary.bufferTime} días
- Nivel de riesgo financiero: ${stats.summary.riskLevel}
`;

        // 2. Call Gemini with the RAG context + user question
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${ragContext}\n\nPregunta del usuario: ${message}`);
        const reply = result.response.text();

        res.status(200).json({ success: true, reply });

    } catch (error) {
        // If Gemini fails (e.g. no API key), fall back gracefully
        console.error('Gemini AI error:', error.message);
        next(error);
    }
};
