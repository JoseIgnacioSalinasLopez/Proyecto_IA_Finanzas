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
            .select('role, content, session_id, created_at, image_url')
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
        const { message, sessionId = 'principal', fileBase64, fileMimeType } = req.body;
        const userId = req.user.id;

        if (!message?.trim() && !fileBase64) {
            return res.status(400).json({ success: false, message: 'El mensaje o el archivo no pueden estar vacíos.' });
        }
        if (!fileBase64 && message && message.length < 60) {
            const lowMsg = message.toLowerCase().trim();
            const stats = await statsService.getStats(userId);
            const { balance = 0, totalIncome = 0, totalExpense = 0 } = stats?.summary || {};

            let fastReply = null;

            // 1. Posibilidad: Resumen General / Balance
            if (/balance|saldo|total|disponible|cuanto tengo|resumen|estado|como voy/i.test(lowMsg)) {
                fastReply = `**Ingresos:** $${totalIncome.toFixed(2)}\n **Gastos:** $${totalExpense.toFixed(2)}\n **Saldo neto:** $${balance.toFixed(2)}`;
            }

            // 2. Posibilidad: Solo Gastos Totales
            else if (/gastos|gastado|gasto|que he gastado|cuanto he gastado/i.test(lowMsg)) {
                fastReply = `Este mes llevas gastados un total de **$${totalExpense.toFixed(2)}**.`;
            }

            // 3. Posibilidad: Solo Ingresos Totales
            else if (/ingresos|ingreso|ganado|gane|cuanto gane/i.test(lowMsg)) {
                fastReply = `Tus ingresos totales este mes son de **$${totalIncome.toFixed(2)}**.`;
            }

            // 4. Posibilidad: Gasto por Categoría (¡La joya de la corona!)
            // Revisamos si el mensaje menciona alguna de tus categorías reales (Comida, Uber, etc.)
            const categoryMatch = stats?.expensesByCategory?.find(cat =>
                lowMsg.includes(cat.name.toLowerCase())
            );

            if (categoryMatch) {
                fastReply = `En la categoría **${categoryMatch.name}** has gastado **$${categoryMatch.total.toFixed(2)}** este mes. 🏷️`;
            }

            // --- RESPUESTA FINAL SI HUBO MATCH ---
            if (fastReply) {
                await supabase.from('chat_messages').insert([
                    { user_id: userId, role: 'user', content: message, session_id: sessionId },
                    { user_id: userId, role: 'assistant', content: fastReply, session_id: sessionId }
                ]);
                return res.status(200).json({ success: true, reply: fastReply });
            }
        }

        // LÓGICA DE SUBIDA A SUPABASE STORAGE (BUCKET)
        let imageUrlParaGuardar = null;

        if (fileBase64 && fileMimeType) {
            try {
                const fileBuffer = Buffer.from(fileBase64, 'base64');
                const extension = fileMimeType.split('/')[1] || 'bin';
                const fileName = `chat_${userId}_${Date.now()}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from('files')
                    .upload(fileName, fileBuffer, { contentType: fileMimeType, upsert: false });

                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage.from('files').getPublicUrl(fileName);
                    // Solo guardamos la URL visual si es una imagen (para no mostrar cuadros rotos en PDFs)
                    if (fileMimeType.startsWith('image/')) {
                        imageUrlParaGuardar = publicUrlData.publicUrl;
                    }
                }
            } catch (storageErr) {
                console.error("Error en storage:", storageErr);
            }
        }

        // --- PROTECCIÓN 1: GUARDAR MENSAJES JUNTOS ---
        // Moví este insert para abajo, para guardarlo al mismo tiempo que la respuesta de la IA.
        // Así evitamos el problema del "mensaje fantasma" en caso de que Gemini falle.

        // 2. Extraer contexto financiero
        const stats = await statsService.getStats(userId);
        const topCategory = stats?.expensesByCategory?.[0];
        const savingsRate = stats?.summary?.totalIncome > 0
            ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1) : 0;

        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeftInMonth = lastDay.getDate() - today.getDate() + 1;

        // 3. EL CEREBRO DE LA IA
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

REGLA C: ESCANEO DE TICKETS, PDFS E IMÁGENES
Si el usuario adjunta una imagen o PDF (un ticket, recibo, factura, menú, tabla), analízalo visualmente. Extrae el monto total, deduce de qué trata (ej. comida, gasolina, salud) y regístralo automáticamente. En tu respuesta (reply), detalla qué fue lo que leíste en el documento de forma amigable.

**[Título corto y amigable del tema]**

[Breve explicación en 1 o 2 líneas fáciles de leer].

**Lo que está pasando:**
- [Punto 1 sencillo]
- [Punto 2 sencillo]

**Qué puedes hacer:**
1. [Paso o recomendación 1]
2. [Paso o recomendación 2]

[Consejo final cálido o resumen motivador].

FORMATO DE SALIDA OBLIGATORIO:
Debes responder ÚNICAMENTE con un JSON válido usando esta estructura:
{ "intent": "registrar_movimiento" | "conversacion", "type": "expense" | "income", "amount": 123.45, "category": "nombre_categoria", "reply": "Tu mensaje de texto aquí..." }
`;

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

        let aiResponse;

        // --- PROTECCIÓN 2: CONTROL DE FALLOS DE LA IA ---
        try {
            const result = await model.generateContent(promptParts);
            const rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
            aiResponse = JSON.parse(rawText);
        } catch (aiError) {
            console.error("Error procesando respuesta de Gemini:", aiError);
            aiResponse = {
                intent: "error",
                reply: "Hubo un pequeño error procesando tu solicitud. Por favor, intenta de nuevo."
            };
        }

        // --- PROTECCIÓN 3: VALIDACIÓN ANTES DE GUARDAR DATOS ---
        if (aiResponse.intent === "registrar_movimiento" && aiResponse.amount && aiResponse.category) {
            let finalCategoryId = null;

            const { data: existingCategory } = await supabase
                .from('categories').select('id').eq('user_id', userId).ilike('name', aiResponse.category).maybeSingle();

            if (existingCategory) {
                finalCategoryId = existingCategory.id;
            } else {
                const { data: newCategory } = await supabase
                    .from('categories').insert([{
                        user_id: userId, name: aiResponse.category.toLowerCase(),
                        type: aiResponse.type || 'expense', color: aiResponse.type === 'income' ? '#34d399' : '#00D4FF'
                    }]).select().single();

                if (newCategory) finalCategoryId = newCategory.id;
            }

            try {
                await transactionService.createTransaction(userId, {
                    amount: Number(aiResponse.amount), type: aiResponse.type || 'expense',
                    category_id: finalCategoryId, description: `Registro vía IA: ${aiResponse.category}`,
                    date: new Date().toISOString()
                });
            } catch (dbError) {
                console.error("Error guardando la transacción:", dbError);
                aiResponse.reply = "Entendí tu movimiento, pero tuve un problema guardándolo. Intenta de nuevo.";
            }
        }

        // 4. Guardar mensaje del usuario Y respuesta de la IA (Soluciona el punto 1)
        await supabase.from('chat_messages').insert([
            {
                user_id: userId,
                role: 'user',
                content: message || "*(Documento adjunto)*",
                session_id: sessionId,
                image_url: imageUrlParaGuardar
            },
            {
                user_id: userId,
                role: 'assistant',
                content: aiResponse.reply,
                session_id: sessionId
            }
        ]);

        res.status(200).json({ success: true, reply: aiResponse.reply });

    } catch (error) {
        // AQUÍ ESTABA EL BUG. Lo cambiamos por un simple console.error seguro.
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

// ==========================================
// FUNCIONES DE GESTIÓN DE SESIONES
// ==========================================

export const getSessions = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Asumiendo que tienes una tabla 'chat_sessions' en Supabase
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

export const createSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title = 'Nueva conversación' } = req.body;

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert([{ user_id: userId, title: title }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const deleteSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const sessionId = req.params.id;

        // 1. Opcional: Borrar los mensajes huérfanos de esta sesión primero
        await supabase
            .from('chat_messages')
            .delete()
            .eq('session_id', sessionId)
            .eq('user_id', userId);

        // 2. Borrar la sesión principal
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
        res.status(200).json({ success: true, message: 'Sesión eliminada correctamente' });
    } catch (error) {
        next(error);
    }
};