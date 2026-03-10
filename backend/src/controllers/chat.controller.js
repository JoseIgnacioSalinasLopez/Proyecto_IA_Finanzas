import { GoogleGenerativeAI } from '@google/generative-ai';
import * as statsService from '../services/stats.service.js';
import * as transactionService from '../services/transaction.service.js';
import { supabase } from '../config/supabaseClient.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. OBTENER TODAS LAS SESIONES
export const getSessions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 2. CREAR NUEVA SESIÓN
export const createSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title } = req.body;

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert([{ user_id: userId, title: title || 'Nueva Conversación' }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 3. BORRAR SESIÓN (Cascada borrará mensajes)
export const deleteSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, message: 'Sesión eliminada.' });
    } catch (error) {
        next(error);
    }
};

// 4. OBTENER HISTORIAL DE UNA SESIÓN
export const getHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        let query = supabase.from('chat_messages').select('role, content, intent, data, created_at').eq('user_id', userId);

        if (sessionId) {
            query = query.eq('session_id', sessionId);
        } else {
            // Si no hay sessionId, devolvemos un array vacío o el último chat (opcional)
            return res.status(200).json({ success: true, data: [] });
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 5. CHAT CON SOPORTE DE SESIÓN Y AUTO-TÍTULO
export const chat = async (req, res, next) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user.id;

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
        }

        let currentSessionId = sessionId;

        // Si no hay sesión, crear una nueva
        if (!currentSessionId) {
            const { data: newSession, error: sError } = await supabase
                .from('chat_sessions')
                .insert([{ user_id: userId, title: 'Nueva Conversación' }])
                .select().single();
            if (sError) throw new Error(sError.message);
            currentSessionId = newSession.id;
        }

        // GUARDAR MENSAJE DEL USUARIO
        await supabase.from('chat_messages').insert([{
            user_id: userId,
            session_id: currentSessionId,
            role: 'user',
            content: message
        }]);

        const stats = await statsService.getStats(userId);
        const topCategory = stats?.expensesByCategory?.[0];
        const savingsRate = stats?.summary?.totalIncome > 0
            ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1) : 0;

        const budgetLimits = stats?.budgetAnalysis?.map(b =>
            `${b.category}: Gastado $${b.spent}, Límite $${b.limit}, Disponible $${b.remaining} (${b.percentage.toFixed(0)}%)`
        ).join(' | ') || 'No hay presupuestos definidos';

        const systemPrompt = `
Eres un asistente financiero personal experto de la aplicación MenteBillete.
DATOS REALES: Balance $${stats?.summary?.balance?.toFixed(2) || 0}, Gasto Diario $${stats?.summary?.dailyBurnRate?.toFixed(2) || 0}.
REGLAS: Responde SIEMPRE en JSON.
INTENTOS: registrar_movimiento, analizar_impacto, deteccion_gastos, asesoramiento_inversion, identificador_deducible, conversacion.
{
  "intent": "...",
  "reply": "...",
  "data": { ... }
}`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(`Pregunta: ${message}`);
        const rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(rawText);

        // Lógica de registro si el intento es registrar_movimiento
        if (aiResponse.intent === "registrar_movimiento") {
            // (Mantenemos lógica idéntica a la anterior para no romper nada)
            let finalCategoryId = null;
            const { data: cat } = await supabase.from('categories').select('id').eq('user_id', userId).ilike('name', aiResponse.category).maybeSingle();
            if (cat) finalCategoryId = cat.id;
            else {
                const { data: nCat } = await supabase.from('categories').insert([{ user_id: userId, name: aiResponse.category.toLowerCase(), type: aiResponse.type, color: aiResponse.type === 'income' ? '#34d399' : '#00D4FF' }]).select().single();
                if (nCat) finalCategoryId = nCat.id;
            }
            await transactionService.createTransaction(userId, { amount: Number(aiResponse.amount), type: aiResponse.type, category_id: finalCategoryId, description: aiResponse.description || `IA: ${aiResponse.category}` });
        }

        // GUARDAR RESPUESTA DE LA IA
        await supabase.from('chat_messages').insert([{
            user_id: userId,
            session_id: currentSessionId,
            role: 'assistant',
            content: aiResponse.reply,
            intent: aiResponse.intent,
            data: aiResponse.data
        }]);

        // AUTO-TÍTULO (Si la sesión se llama "Nueva Conversación")
        try {
            const { data: session } = await supabase.from('chat_sessions').select('title').eq('id', currentSessionId).single();
            if (session && session.title === 'Nueva Conversación') {
                const titleModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const tResult = await titleModel.generateContent(`Genera un título corto (3-5 palabras) en español para esta conversación: "${message}". Responde SOLO con el título, sin comillas.`);
                const newTitle = tResult.response.text().trim();
                await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', currentSessionId);
            }
        } catch (tError) {
            console.error('Error generando título:', tError);
        }

        res.status(200).json({ success: true, sessionId: currentSessionId, ...aiResponse });

    } catch (error) {
        console.error('Gemini AI error:', error.message);
        next(error);
    }
};