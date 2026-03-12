import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, User, Sparkles, Mic, Trash2, Plus, MessageSquare, Paperclip, X, FileText } from 'lucide-react';
import api from '../services/api';
import iaLogo from '../assets/Imagen pegada.png';
import { useLanguage } from '../context/LanguageContext';

function TypingBubble() {
    return (
        <div className="flex justify-start">
            <div className="flex max-w-[70%] gap-4 flex-row">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-[#11111d] border border-[#8C30F5]/50 flex items-center justify-center overflow-hidden p-0.5 shadow-[0_0_20px_rgba(140,48,245,0.6)]">
                    <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                </div>
                {/* Burbuja brillante para el "escribiendo" */}
                <div className="p-[1.5px] rounded-2xl rounded-bl-sm bg-gradient-to-r from-[#00D4FF]/80 to-[#8C30F5]/80 shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                    <div className="p-4 rounded-[15px] rounded-bl-sm bg-[#05011a]/95 flex items-center gap-1.5 backdrop-blur-md">
                        <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce [animation-delay:0ms] shadow-[0_0_10px_rgba(0,212,255,0.8)]"></span>
                        <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce [animation-delay:150ms] shadow-[0_0_10px_rgba(0,212,255,0.8)]"></span>
                        <span className="w-2 h-2 bg-[#00D4FF] rounded-full animate-bounce [animation-delay:300ms] shadow-[0_0_10px_rgba(0,212,255,0.8)]"></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ChatIA() {
    const { t } = useLanguage();

    const [allHistory, setAllHistory] = useState([]);
    const [sessionList, setSessionList] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(() => `chat_${Date.now()}`);
    const [messages, setMessages] = useState([{ role: 'assistant', content: t('ai_welcome') }]);

    const [chatServiceError, setChatServiceError] = useState(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    // NUEVOS ESTADOS PARA EL ESCÁNER DE ARCHIVOS
    const [attachedFile, setAttachedFile] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [sessionIdToDelete, setSessionIdToDelete] = useState(null);

    const loadChatHistory = async () => {
        try {
            const res = await api.get('/chat');
            if (res.data && res.data.data) {
                const history = res.data.data;
                setAllHistory(history);
                const uniqueSessions = [...new Set(history.map(m => m.session_id))].reverse();
                setSessionList(uniqueSessions);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    };

    useEffect(() => {
        loadChatHistory();
    }, [t]);

    useEffect(() => {
        const currentMessages = allHistory.filter(m => m.session_id === currentSessionId);
        if (currentMessages.length > 0) {
            setMessages([{ role: 'assistant', content: t('ai_welcome') }, ...currentMessages]);
        } else {
            setMessages([{ role: 'assistant', content: t('ai_welcome') }]);
        }
    }, [currentSessionId, allHistory, t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const startNewConversation = () => {
        setCurrentSessionId(`chat_${Date.now()}`);
    };

    const [recognitionObj, setRecognitionObj] = useState(null);

    const handleVoiceInput = () => {
        if (isListening && recognitionObj) {
            recognitionObj.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Tu navegador no soporta el dictado nativo. Usa Chrome.");

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;

        let currentText = input ? input + ' ' : '';

        recognition.onstart = () => {
            setIsListening(true);
            setRecognitionObj(recognition);
        };

        recognition.onresult = (e) => {
            let interimText = '';
            let finalAddedText = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalAddedText += transcript + ' ';
                else interimText += transcript;
            }
            currentText += finalAddedText;
            setInput(currentText + interimText);
        };

        recognition.onerror = (e) => {
            console.error("Error del micrófono:", e.error);
            if (e.error !== 'no-speech') {
                setIsListening(false);
                setRecognitionObj(null);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            setRecognitionObj(null);
        };

        try { recognition.start(); } catch (error) { console.error(error); }
    };

    const handleRequestDeleteChat = (idToDelete) => {
        setSessionIdToDelete(idToDelete);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!sessionIdToDelete) return;
        try {
            await api.delete(`/chat?sessionId=${sessionIdToDelete}`);
            if (currentSessionId === sessionIdToDelete) {
                setCurrentSessionId(`chat_${Date.now()}`);
            }
            setIsConfirmModalOpen(false);
            setSessionIdToDelete(null);
            loadChatHistory();
        } catch (error) {
            console.error("Error al borrar historial", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "No fue posible eliminar la conversación." }]);
            setIsConfirmModalOpen(false);
            setSessionIdToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setIsConfirmModalOpen(false);
        setSessionIdToDelete(null);
    };

    // FUNCION PARA LEER EL ARCHIVO A BASE64
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limitar a 5MB por seguridad
        if (file.size > 5 * 1024 * 1024) return alert("El archivo es demasiado grande. Máximo 5MB.");

        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachedFile({
                base64: reader.result.split(',')[1],
                mimeType: file.type,
                name: file.name,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
            });
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = async (text) => {
        const userText = text.trim();
        // Modificado: Si no hay texto NI archivo, no hacemos nada
        if (!userText && !attachedFile) return;

        // Pintamos el mensaje (si mandó foto sin texto, ponemos un aviso)
        setMessages(prev => [...prev, {
            role: 'user',
            content: userText,
            // NUEVO: Guardamos la URL de la vista previa para pintarla en la burbuja
            imageUrl: attachedFile?.preview || null
        }]);

        setInput('');
        const fileToSend = attachedFile;
        setAttachedFile(null); // Borramos la vista previa visual
        setIsTyping(true);
        setChatServiceError(null);

        try {
            // Mandamos el paquete completo al backend
            const payload = {
                message: userText,
                sessionId: currentSessionId,
                fileBase64: fileToSend?.base64 || null,
                fileMimeType: fileToSend?.mimeType || null
            };
            const res = await api.post('/chat', payload);
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
            loadChatHistory();
        } catch (error) {
            console.error('Error en el servicio de chat:', error);
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
        return content.split('\n').map((line, index) => {
            if (line.trim() === '') return <div key={index} className="h-2"></div>;
            return (
                <p key={index} className="mb-1 text-gray-200">
                    {line.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i} className="text-[#00D4FF] drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]">{part}</strong> : part
                    )}
                </p>
            );
        });
    };

    const formatSessionName = (id) => {
        const sessionMessages = allHistory.filter(m => m.session_id === id && m.role === 'user');
        if (sessionMessages.length > 0) {
            let title = sessionMessages[0].content.trim();
            title = title.charAt(0).toUpperCase() + title.slice(1);
            return title.length > 28 ? title.substring(0, 28) + '...' : title;
        }
        return 'Nueva Conversación';
    };

    return (
        <div className="flex h-[calc(100vh-5rem)] -m-4 md:-m-6 relative rounded-t-3xl overflow-hidden shadow-2xl z-10 bg-[#05011a]">
            {/* SIDEBAR DINÁMICO */}
            <div className="hidden md:flex flex-col w-64 bg-[#0a0520] border-r border-white/5 p-4 flex-shrink-0 relative z-20 shadow-[5px_0_20px_rgba(0,0,0,0.5)]">
                <Link to="/" className="text-finance-muted hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all mb-6 text-sm flex items-center gap-2">
                    ← Volver a Mis Finanzas
                </Link>

                {/* BOTÓN "NUEVA CONVERSACIÓN" CON AURA BRILLANTE */}
                <div className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-[#8C30F5] to-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] transition-all duration-300 mb-6 cursor-pointer">
                    <button
                        onClick={startNewConversation}
                        className="flex items-center gap-2 w-full bg-[#0a0520] text-white p-3 rounded-[10px] hover:bg-[#110833] transition-colors text-sm font-bold"
                    >
                        <Plus size={18} className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" /> Nueva Conversación
                    </button>
                </div>

                <div className="text-xs font-bold text-finance-muted mb-3 uppercase tracking-wider drop-shadow-md">Historial Reciente</div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'none' }}>
                    {sessionList.map(sessionId => (
                        <div
                            key={sessionId}
                            onClick={() => setCurrentSessionId(sessionId)}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === sessionId ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-transparent hover:bg-white/5 border-transparent'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare size={16} className={currentSessionId === sessionId ? "text-[#00D4FF] drop-shadow-[0_0_5px_rgba(0,212,255,0.8)]" : "text-gray-500"} />
                                <span className={`text-sm truncate ${currentSessionId === sessionId ? "text-white font-medium" : "text-gray-400"}`}>
                                    {formatSessionName(sessionId)}
                                </span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRequestDeleteChat(sessionId); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.5)]"
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
                        {/* Avatar IA brillante */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.6)] overflow-hidden p-[2px]">
                            <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white leading-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Asistente IA</h2>
                                <span className="flex items-center gap-1 text-[10px] bg-[#4F46E5]/20 text-[#00D4FF] px-2 py-0.5 rounded-full font-bold border border-[#00D4FF]/40 shadow-[0_0_10px_rgba(0,212,255,0.3)]">
                                    <Sparkles size={9} /> Gemini
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse shadow-[0_0_10px_rgba(0,212,255,0.8)]"></span>
                                <p className="text-xs text-[#00D4FF] drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">{t('connected_data')}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 md:px-20 pb-4 pt-4 space-y-6" style={{ scrollbarWidth: 'none' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* AVATARES */}
                                {msg.role === 'assistant' ? (
                                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-[#11111d] border border-[#00D4FF]/50 flex items-center justify-center mt-auto overflow-hidden p-0.5 shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                                        <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#0d0f1a] border border-[#E600E6]/50 flex items-center justify-center mt-auto shadow-[0_0_15px_rgba(230,0,230,0.5)]">
                                        <User size={20} className="text-[#E600E6] drop-shadow-[0_0_5px_rgba(230,0,230,0.8)]" />
                                    </div>
                                )}

                                {/* BURBUJAS DE MENSAJE CON BORDES DEGRADADOS Y AURA */}
                                <div className={`p-[1.5px] rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.5)] ${msg.role === 'user'
                                    ? 'bg-gradient-to-l from-[#8C30F5]/80 to-[#E600E6]/80 shadow-[0_0_20px_rgba(140,48,245,0.3)]' // Glow púrpura para usuario
                                    : 'bg-gradient-to-r from-[#00D4FF]/80 to-[#8C30F5]/80 shadow-[0_0_20px_rgba(0,212,255,0.3)]'  // Glow cian para IA
                                    }`}>
                                    <div className={`rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.5)] ${msg.role === 'user'
                                        ? 'bg-gradient-to-l from-[#8C30F5]/80 to-[#E600E6]/80 p-[1.5px]' // Glow user
                                        : 'p-[1px] bg-white/10'  // Borde simple asistente
                                        }`}>
                                        <div className={`p-5 rounded-[22px] ${msg.role === 'user'
                                            ? 'bg-[#150a26]/95 text-white'
                                            : 'bg-[#05011a]/95 text-gray-200'
                                            }`}>
                                            {/* NUEVO: Dibujar la imagen del ticket si existe */}
                                            {msg.imageUrl && (
                                                <img
                                                    src={msg.imageUrl}
                                                    alt="Ticket adjunto"
                                                    className="w-full max-w-[200px] rounded-lg mb-3 border border-white/20 shadow-md transition-all hover:max-w-xs cursor-pointer"
                                                />
                                            )}
                                            {/* Renderizado de texto normal */}
                                            <div className="text-[15px] leading-relaxed">
                                                {renderContent(msg.content)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                    {isTyping && <TypingBubble />}
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* ZONA INFERIOR (INPUT CON AURA NEÓN) */}
                <div className="shrink-0 bg-[#05011a] px-4 md:px-20 pb-2 pt-4 relative z-20">
                    <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-[#05011a] to-transparent pointer-events-none"></div>

                    {/* BURBUJA DE PREVIEW DEL ARCHIVO ADJUNTO */}
                    {attachedFile && (
                        <div className="mx-auto max-w-4xl mb-2 flex items-center gap-3 p-2 bg-[#8C30F5]/20 border border-[#8C30F5]/50 rounded-xl w-max shadow-[0_0_15px_rgba(140,48,245,0.3)] animate-fade-in">
                            {attachedFile.preview ? (
                                <img src={attachedFile.preview} alt="preview" className="w-10 h-10 rounded border border-white/20 object-cover" />
                            ) : (
                                <FileText size={28} className="text-[#00D4FF] p-1 bg-black/40 rounded" />
                            )}
                            <span className="text-xs text-white truncate max-w-[150px] font-medium">{attachedFile.name}</span>
                            <button onClick={() => setAttachedFile(null)} className="text-red-400 hover:text-red-300 ml-2 p-1 hover:bg-red-400/20 rounded transition-colors" title="Quitar archivo">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* CONTENEDOR DE LA CAJA DE TEXTO CON EFECTO DE LUZ */}
                    <div className="mx-auto max-w-4xl relative rounded-3xl p-[1.5px] bg-gradient-to-r from-[#00D4FF] via-[#8C30F5] to-[#E600E6] shadow-[0_0_30px_rgba(140,48,245,0.4)] focus-within:shadow-[0_0_50px_rgba(0,212,255,0.6)] transition-all duration-500">

                        <form
                            onSubmit={handleSubmit}
                            className="bg-[#0b061c]/95 backdrop-blur-3xl rounded-[22px] p-3 flex flex-col w-full h-full"
                        >
                            {/* INPUT OCULTO PARA ARCHIVOS */}
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <textarea
                                disabled={isTyping}
                                className="w-full bg-transparent border-none px-4 py-3 text-white text-lg leading-relaxed focus:outline-none focus:ring-0 placeholder:text-gray-500/70 disabled:opacity-50 mb-2 resize-none overflow-y-auto drop-shadow-md"
                                style={{ minHeight: '56px', maxHeight: '200px' }}
                                rows="1"
                                placeholder={isListening ? 'Escuchando tu voz...' : attachedFile ? 'Agrega un mensaje a tu documento...' : 'Escribe, dicta o sube un ticket...'}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = '56px';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if ((input.trim() || attachedFile) && !isTyping) {
                                            sendMessage(input);
                                            e.target.style.height = '56px';
                                        }
                                    }
                                }}
                            />

                            <div className="flex justify-between items-center px-2">
                                <div className="flex gap-2">
                                    {/* BOTÓN ADJUNTAR ARCHIVO (CLIP) */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 rounded-full transition-all duration-300 bg-[#8C30F5]/10 text-[#8C30F5] hover:bg-[#8C30F5]/20 shadow-[0_0_15px_rgba(140,48,245,0.2)] hover:shadow-[0_0_25px_rgba(140,48,245,0.5)] border border-[#8C30F5]/30"
                                        title="Subir ticket o PDF"
                                    >
                                        <Paperclip size={20} className="drop-shadow-[0_0_5px_currentColor]" />
                                    </button>

                                    {/* BOTÓN MICROFONO BRILLANTE */}
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        className={`p-2.5 rounded-full transition-all duration-300 ${isListening
                                            ? 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse border border-red-500/50'
                                            : 'bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.6)] border border-[#00D4FF]/30'
                                            }`}
                                        title="Dictar por voz"
                                    >
                                        <Mic size={20} className="drop-shadow-[0_0_5px_currentColor]" />
                                    </button>
                                </div>

                                {/* BOTÓN ENVIAR BRILLANTE */}
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !attachedFile) || isTyping}
                                    className="w-11 h-11 rounded-full bg-gradient-to-r from-[#8C30F5] to-[#E600E6] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-[0_0_20px_rgba(230,0,230,0.6)] hover:shadow-[0_0_30px_rgba(230,0,230,0.9)] hover:scale-105 border border-white/20"
                                >
                                    <Send size={18} className="ml-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="text-center text-[11px] text-[#00D4FF]/60 mt-4 font-medium tracking-widest drop-shadow-[0_0_5px_rgba(0,212,255,0.3)] uppercase">
                        Mente Billete AI puede cometer errores. Verifica las transacciones.
                    </p>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md" onClick={handleCancelDelete}>
                    {/* Modal con aura roja */}
                    <div
                        className="relative rounded-3xl p-[1.5px] w-full max-w-md bg-gradient-to-tr from-red-500/80 to-[#8C30F5]/50 shadow-[0_0_40px_rgba(239,68,68,0.4)] transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#0b061c] rounded-[22px] p-6 w-full h-full">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-red-500/20 p-4 rounded-full text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-500/30">
                                    <Trash2 size={24} className="drop-shadow-[0_0_5px_currentColor]" />
                                </div>
                                <h3 className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                    ¿Estás seguro que quieres borrar este chat?
                                </h3>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={handleCancelDelete}
                                    className="text-gray-300 hover:text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.6)] hover:shadow-[0_0_25px_rgba(239,68,68,0.9)]"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}