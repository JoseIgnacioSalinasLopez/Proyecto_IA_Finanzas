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

// 3. BORRAR SESIÓN
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
            return res.status(200).json({ success: true, data: [] });
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 5. CHAT CON SOPORTE DE SESIÓN, AUTO-TÍTULO Y ESCÁNER DE ARCHIVOS
export const chat = async (req, res, next) => {
    try {
        const { message, sessionId, fileBase64, fileMimeType } = req.body;
        const userId = req.user.id;

        // Validamos que haya un mensaje O un archivo
        if (!message?.trim() && !fileBase64) {
            return res.status(400).json({ success: false, message: 'El mensaje o el archivo no pueden estar vacíos.' });
        }

        let currentSessionId = sessionId;

        // Si no hay sesión, crear una nueva
        if (!currentSessionId || currentSessionId === 'principal') {
            const { data: newSession, error: sError } = await supabase
                .from('chat_sessions')
                .insert([{ user_id: userId, title: 'Nueva Conversación' }])
                .select().single();
            if (sError) throw new Error(sError.message);
            currentSessionId = newSession.id;
        }

        // 1. Guardar mensaje del usuario
        await supabase.from('chat_messages').insert([{ 
            user_id: userId, 
            session_id: currentSessionId,
            role: 'user', 
            content: message || "*(Documento adjunto)*" 
        }]);

        // 2. Extraer contexto financiero
        const stats = await statsService.getStats(userId);
        const topCategory = stats?.expensesByCategory?.[0];
        
        // Cálculo de días restantes del mes
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeftInMonth = lastDay.getDate() - today.getDate() + 1;

        // 3. Prompt Estructurado (Mezcla de ambos mundos)
        const systemPrompt = `
Eres el Asistente IA de MenteBillete. Tu misión es explicar las finanzas de forma tan sencilla, casual y amigable que hasta un niño o un adulto mayor puedan entenderlo sin dudar.

DATOS FINANCIEROS DEL USUARIO:
- Balance neto: $${stats?.summary?.balance?.toFixed(2) || 0}
- Ingresos: $${stats?.summary?.totalIncome?.toFixed(2) || 0} | Gastos: $${stats?.summary?.totalExpense?.toFixed(2) || 0}
- Categoría con más gastos: ${topCategory ? `${topCategory.name}` : 'N/A'}
- Presupuesto diario seguro actual: $${stats?.summary?.dailyBurnRate?.toFixed(2) || 0}
- Días restantes del mes: ${daysLeftInMonth}

REGLAS DE ORO:
1. Responde SIEMPRE en un único bloque JSON.
2. Usa Markdown amigable en el campo "reply".
3. Divide la info con títulos y listas.
4. Si registras algo, usa el intent "registrar_movimiento".

INTENTOS SOPORTADOS (json.intent): registrar_movimiento, analizar_impacto, deteccion_gastos, asesoramiento_inversion, identificador_deducible, conversacion.

ESTRUCTURA JSON OBLIGATORIA:
{
  "intent": "...",
  "reply": "...",
  "data": { ... },
  "amount": (opcional),
  "type": "expense/income" (opcional),
  "category": "nombre" (opcional)
}

Si el usuario adjunta un documento (ticket/factura), extráelo y regístralo.`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: "application/json" }
        });

        const promptParts = [`Mensaje del usuario: ${message || 'Analiza este documento por favor.'}`];
        if (fileBase64 && fileMimeType) {
            promptParts.push({
                inlineData: { data: fileBase64, mimeType: fileMimeType }
            });
        }

        const result = await model.generateContent(promptParts);
        const rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const aiResponse = JSON.parse(rawText);

        // Lógica de registro si el intento es registrar_movimiento
        if (aiResponse.intent === "registrar_movimiento") {
            let finalCategoryId = null;
            const { data: cat } = await supabase.from('categories').select('id').eq('user_id', userId).ilike('name', aiResponse.category).maybeSingle();
            if (cat) finalCategoryId = cat.id;
            else {
                const { data: nCat } = await supabase.from('categories').insert([{ user_id: userId, name: aiResponse.category.toLowerCase(), type: aiResponse.type, color: aiResponse.type === 'income' ? '#34d399' : '#00D4FF' }]).select().single();
                if (nCat) finalCategoryId = nCat.id;
            }

            await transactionService.createTransaction(userId, {
                amount: Number(aiResponse.amount), 
                type: aiResponse.type,
                category_id: finalCategoryId, 
                description: `Registro vía IA: ${aiResponse.category}`,
                date: new Date().toISOString()
            });
        }

        // 4. Guardar respuesta de la IA
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
                const tResult = await titleModel.generateContent(`Genera un título corto (3-5 palabras) en español para esta conversación: "${message || 'Archivo adjunto'}". Responde SOLO con el título, sin comillas.`);
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