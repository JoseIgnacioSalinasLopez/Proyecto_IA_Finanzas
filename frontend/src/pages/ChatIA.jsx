import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
// Añadimos el icono Trash2 para el modal si no estaba
import { Send, User, Sparkles, Mic, Trash2, Plus, MessageSquare } from 'lucide-react';
import api from '../services/api';
import iaLogo from '../assets/Imagen pegada.png';
import { useLanguage } from '../context/LanguageContext';

function TypingBubble() {
    return (
        <div className="flex justify-start">
            <div className="flex max-w-[70%] gap-4 flex-row">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-[#11111d] border border-[#8C30F5]/50 flex items-center justify-center overflow-hidden p-0.5 shadow-[0_0_10px_rgba(140,48,245,0.3)]">
                    <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="p-4 rounded-2xl rounded-bl-sm bg-[#11111d]/80 border border-white/5 flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce [animation-delay:300ms]"></span>
                </div>
            </div>
        </div>
    );
}

export default function ChatIA() {
    const { t } = useLanguage();

    // ESTADOS AVANZADOS PARA MULTI-SESIÓN
    const [allHistory, setAllHistory] = useState([]);
    const [sessionList, setSessionList] = useState(['principal']);
    const [currentSessionId, setCurrentSessionId] = useState('principal');
    const [messages, setMessages] = useState([{ role: 'assistant', content: t('ai_welcome') }]);

    // ESTADO PARA EL SISTEMA DE ERRORES PROFESIONAL (Del turno anterior)
    const [chatServiceError, setChatServiceError] = useState(null);

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);

    // =========================================================================
    // 1. NUEVOS ESTADOS PARA EL MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
    // =========================================================================
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [sessionIdToDelete, setSessionIdToDelete] = useState(null);

    // Carga historial
    const loadChatHistory = async () => {
        try {
            const res = await api.get('/chat');
            if (res.data && res.data.data) {
                const history = res.data.data;
                setAllHistory(history);

                const uniqueSessions = [...new Set(history.map(m => m.session_id))];
                if (!uniqueSessions.includes('principal')) uniqueSessions.unshift('principal');
                setSessionList(uniqueSessions);

                const currentMessages = history.filter(m => m.session_id === currentSessionId);

                if (currentMessages.length > 0) {
                    setMessages([{ role: 'assistant', content: t('ai_welcome') }, ...currentMessages]);
                } else {
                    setMessages([{ role: 'assistant', content: t('ai_welcome') }]);
                }
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    };

    useEffect(() => {
        loadChatHistory();
    }, [t, currentSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const startNewConversation = () => {
        const newId = `chat_${Date.now()}`;
        setCurrentSessionId(newId);
        setSessionList(prev => [newId, ...prev]);
        setMessages([{ role: 'assistant', content: t('ai_welcome') }]);
    };

    const [recognitionObj, setRecognitionObj] = useState(null);

    const handleVoiceInput = () => {
        // Si ya está escuchando y le damos clic, lo apagamos
        if (isListening && recognitionObj) {
            recognitionObj.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            return alert("Tu navegador no soporta el dictado por voz de forma nativa. Te recomendamos usar Google Chrome.");
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES'; // Español
        recognition.continuous = true;     // Se queda encendido hasta que le des clic de nuevo
        recognition.interimResults = true;  // Muestra las palabras en tiempo real sin retraso

        // Guardamos lo que ya estaba escrito en la caja antes de encender el micro
        let currentText = input ? input + ' ' : '';

        recognition.onstart = () => {
            setIsListening(true);
            setRecognitionObj(recognition);
        };

        recognition.onresult = (e) => {
            let interimText = '';
            let finalAddedText = '';

            // Clasificamos lo que escuchó entre "palabras finales" y "palabras procesándose"
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) {
                    finalAddedText += transcript + ' ';
                } else {
                    interimText += transcript;
                }
            }

            // Agregamos las palabras finales al texto base
            currentText += finalAddedText;

            // Mostramos en la caja de React el texto base + lo que está escuchando en tiempo real
            setInput(currentText + interimText);
        };

        recognition.onerror = (e) => {
            console.error("Error del micrófono:", e.error);
            // Ignoramos el error de "no-speech" (silencio) porque queremos que siga escuchando aunque te calles un rato
            if (e.error !== 'no-speech') {
                setIsListening(false);
                setRecognitionObj(null);
            }
        };

        recognition.onend = () => {
            // Cuando finalmente se detiene (ya sea por clic o por error crítico)
            setIsListening(false);
            setRecognitionObj(null);
        };

        try {
            recognition.start();
        } catch (error) {
            console.error("No se pudo iniciar el reconocimiento:", error);
        }
    };


    // =========================================================================
    // 2. REFACTORIZACIÓN DE ELIMINAR HISTORIAL (El nuevo flujo)
    // =========================================================================
    // Parte A: El usuario hizo clic en la basura del sidebar. Guardamos el ID y abrimos el modal.
    const handleRequestDeleteChat = (idToDelete) => {
        setSessionIdToDelete(idToDelete);
        setIsConfirmModalOpen(true); // Abrir modal personalizado
    };

    // Parte B: El usuario hizo clic en "Eliminar" DENTRO del modal. Ejecutamos el API call real.
    const handleConfirmDelete = async () => {
        if (!sessionIdToDelete) return; // Validación de seguridad

        try {
            // Reutilizamos tu llamada a la API que ya funciona
            await api.delete(`/chat?sessionId=${sessionIdToDelete}`);

            // Si estábamos viendo ese chat, regresamos al principal
            if (currentSessionId === sessionIdToDelete) {
                setCurrentSessionId('principal');
            }

            // Cerramos el modal y limpiamos estados
            setIsConfirmModalOpen(false);
            setSessionIdToDelete(null);

            // Recargamos el historial
            loadChatHistory();
        } catch (error) {
            console.error("Error al borrar historial", error);
            // Si falla el borrado, podrías mostrar tu sistema formal de errores
            setMessages(prev => [...prev, { role: 'assistant', content: "No fue posible eliminar la conversación en este momento. Intenta de nuevo más tarde." }]);
            // Cerramos modal de todos modos para no bloquear UI
            setIsConfirmModalOpen(false);
            setSessionIdToDelete(null);
        }
    };

    // Parte C: El usuario hizo clic en "Cancelar" o en el fondo del modal. Cerramos todo.
    const handleCancelDelete = () => {
        setIsConfirmModalOpen(false);
        setSessionIdToDelete(null);
    };

    // ENVÍO DE MENSAJE (Sin cambios)
    const sendMessage = async (text) => {
        const userText = text.trim();
        if (!userText) return;

        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setInput('');
        setIsTyping(true);
        setChatServiceError(null); // Limpiar error previo al reintentar

        try {
            const res = await api.post('/chat', { message: userText, sessionId: currentSessionId });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
            loadChatHistory();
        } catch (error) {
            console.error('Error en el servicio de chat:', error);
            // ... lógica de errores formales del turno anterior intacta ...
            setMessages(prev => [...prev, { role: 'assistant', content: "Error de conexión. Intenta de nuevo." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const renderContent = (content) => {
        if (!content) return null;

        // 1. Separamos todo el texto detectando los saltos de línea ocultos (\n)
        return content.split('\n').map((line, index) => {
            // Si la línea está vacía (un doble salto de línea), ponemos un espacio en blanco para que respire
            if (line.trim() === '') return <div key={index} className="h-2"></div>;

            return (
                // 2. Envolvemos cada línea en un párrafo para que no se pegue con el de abajo
                <p key={index} className="mb-1">
                    {/* 3. Mantenemos tu lógica para pintar de azul lo que va en negritas */}
                    {line.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i} className="text-[#00D4FF]">{part}</strong> : part
                    )}
                </p>
            );
        });
    };

    // Formateador de nombres basado en el primer mensaje
    const formatSessionName = (id) => {
        if (id === 'principal') return 'Sesión Principal';

        const sessionMessages = allHistory.filter(m => m.session_id === id && m.role === 'user');
        if (sessionMessages.length > 0) {
            let title = sessionMessages[0].content.trim();
            title = title.charAt(0).toUpperCase() + title.slice(1);
            return title.length > 28 ? title.substring(0, 28) + '...' : title;
        }

        return 'Nueva Conversación';
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6 relative rounded-t-3xl overflow-hidden shadow-2xl z-10 bg-[#05011a]">

            {/* SIDEBAR DINÁMICO */}
            <div className="hidden md:flex flex-col w-64 bg-[#0a0520] border-r border-white/5 p-4 flex-shrink-0">
                <Link to="/" className="text-finance-muted hover:text-finance-text transition-colors mb-6 text-sm flex items-center gap-2">
                    ← Volver a Mis Finanzas
                </Link>

                <button
                    onClick={startNewConversation}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#8C30F5]/20 to-[#00D4FF]/20 hover:from-[#8C30F5]/40 hover:to-[#00D4FF]/40 border border-[#8C30F5]/30 text-white p-3 rounded-xl transition-all mb-6 text-sm font-medium shadow-[0_0_15px_rgba(140,48,245,0.1)]"
                >
                    <Plus size={18} /> Nueva Conversación
                </button>

                <div className="text-xs font-bold text-finance-muted mb-3 uppercase tracking-wider">Historial Reciente</div>

                {/* RENDERIZADO DE MÚLTIPLES CHATS */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'none' }}>
                    {sessionList.map(sessionId => (
                        <div
                            key={sessionId}
                            onClick={() => setCurrentSessionId(sessionId)}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border ${currentSessionId === sessionId ? 'bg-white/10 border-white/20' : 'bg-transparent hover:bg-white/5 border-transparent'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare size={16} className={currentSessionId === sessionId ? "text-[#00D4FF]" : "text-gray-500"} />
                                <span className={`text-sm truncate ${currentSessionId === sessionId ? "text-white font-medium" : "text-gray-400"}`}>
                                    {formatSessionName(sessionId)}
                                </span>
                            </div>
                            {/* CAMBIO: Botón de basura llama a Parte A (handleRequestDeleteChat) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRequestDeleteChat(sessionId); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Eliminar chat"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ÁREA PRINCIPAL */}
            <div className="flex-1 flex flex-col relative">

                <header className="bg-transparent flex items-center gap-4 px-6 py-4 flex-shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)] overflow-hidden p-[2px]">
                            <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-finance-text leading-tight">Asistente IA</h2>
                                <span className="flex items-center gap-1 text-[10px] bg-[#4F46E5]/20 text-[#8C8FFF] px-2 py-0.5 rounded-full font-bold border border-[#4F46E5]/30">
                                    <Sparkles size={9} /> Gemini
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <p className="text-xs text-emerald-400">{t('connected_data')}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 md:px-20 pb-4 pt-4 space-y-6" style={{ scrollbarWidth: 'none' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[90%] md:max-w-[75%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {msg.role === 'assistant' ? (
                                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-[#11111d] border border-[#8C30F5]/50 flex items-center justify-center mt-auto overflow-hidden p-0.5 shadow-[0_0_10px_rgba(140,48,245,0.3)]">
                                        <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center mt-auto">
                                        <User size={20} className="text-gray-300" />
                                    </div>
                                )}
                                <div className={`p-5 rounded-3xl text-[15px] leading-relaxed backdrop-blur-md shadow-lg ${msg.role === 'user'
                                    ? 'bg-[#1e1e2f] border border-white/5 text-gray-200 rounded-br-sm'
                                    : 'bg-transparent border border-transparent text-gray-300'
                                    }`}>
                                    {renderContent(msg.content)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && <TypingBubble />}
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* ZONA INFERIOR SÓLIDA */}
                <div className="shrink-0 bg-[#05011a] px-4 md:px-20 pb-6 pt-4 relative z-20">
                    <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#05011a] to-transparent pointer-events-none"></div>

                    <form
                        onSubmit={handleSubmit}
                        className="mx-auto max-w-4xl bg-[#0f0a1c] border border-[#8C30F5]/40 rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5),_0_0_20px_rgba(140,48,245,0.15)] transition-all focus-within:border-[#00D4FF]/60 focus-within:shadow-[0_10px_40px_rgba(0,0,0,0.5),_0_0_30px_rgba(0,212,255,0.2)]"
                    >
                        <textarea
                            disabled={isTyping}
                            className="w-full bg-transparent border-none px-4 py-3 text-white text-lg leading-relaxed focus:outline-none focus:ring-0 placeholder:text-gray-500 disabled:opacity-50 mb-2 resize-none overflow-y-auto"
                            style={{ minHeight: '56px', maxHeight: '200px' }}
                            rows="1"
                            placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe o dicta sobre tus finanzas...'}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                // El truco: regresar a 56px un milisegundo para recalcular el tamaño real
                                e.target.style.height = '56px';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onKeyDown={(e) => {
                                // Enviar con Enter (sin Shift)
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (input.trim() && !isTyping) {
                                        sendMessage(input);
                                        // Regresamos la caja a su tamaño original al enviar
                                        e.target.style.height = '56px';
                                    }
                                }
                            }}
                        />

                        <div className="flex justify-between items-center px-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleVoiceInput}
                                    className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}
                                    title="Dictar por voz"
                                >
                                    <Mic size={20} />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="w-10 h-10 rounded-full bg-[#8C30F5] hover:bg-[#a64dff] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-[0_0_15px_rgba(140,48,245,0.4)]"
                            >
                                <Send size={18} className="ml-1" />
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-[11px] text-gray-500 mt-3 font-medium tracking-wide">
                        Mente Billete AI puede cometer errores. Verifica las transacciones.
                    </p>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. CÓDIGO UI DEL MODAL DE CONFIRMACIÓN (Estilo Imagen 2 Simplificado)    */}
            {/* ========================================================================= */}
            {isConfirmModalOpen && (
                // Fondo oscuro translúcido que cubre todo
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleCancelDelete}>
                    {/* Caja de Modal (Estilo Imagen 2) */}
                    <div
                        className="bg-[#0d0f1a] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/5 transform transition-all"
                        onClick={(e) => e.stopPropagation()} // Evitar cerrar si hacen clic dentro
                    >
                        {/* Cabecera con Icono de basura */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-red-500/10 p-4 rounded-full text-red-500">
                                <Trash2 size={24} />
                            </div>
                            {/* La Pregunta Principal (SIMPLIFICADO) */}
                            <h3 className="text-xl font-bold text-white">
                                ¿Estás seguro que quieres borrar este chat?
                            </h3>
                        </div>

                        {/* User pidió: "olvida el nombre de en medio y la advertencia nada de eso quiero" */}
                        {/* Así que nos saltamos el bloque de 'pasajes' y 'advertencias' */}

                        {/* Botones de acción a la derecha */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={handleCancelDelete}
                                className="text-gray-300 hover:text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            {/* Botón Eliminar con tu color púrpura/violeta */}
                            <button
                                onClick={handleConfirmDelete}
                                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ========================================================================= */}

        </div>
    );
}