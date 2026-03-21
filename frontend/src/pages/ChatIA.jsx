import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, User, Sparkles, Mic, Trash2, Plus, MessageSquare, Paperclip, X, FileText, Volume2, VolumeX } from 'lucide-react';
import api from '../services/api';
import iaLogo from '../assets/IAboy.gif';
import iaLogoLight from '../assets/IAboy claro.gif';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import GlobalLoader from '../components/ui/GlobalLoader';

function TypingBubble() {
    const { theme } = useTheme();
    const currentIALogo = theme === 'light' ? iaLogoLight : iaLogo;
    return (
        <div className="flex justify-start">
            <div className="flex max-w-[70%] gap-4 flex-row">
                <div className={`w-20 h-20 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${theme === 'light' ? 'bg-black shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'bg-[#11111d]'}`}>
                    <img src={currentIALogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                </div>
                {/* Burbuja brillante para el "escribiendo" */}
                <div className="rounded-2xl rounded-bl-sm bg-transparent">
                    <div className={`p-4 rounded-[15px] rounded-bl-sm flex items-center gap-1.5 backdrop-blur-md border ${theme === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#05011a]/95 border-white/10'}`}>
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
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const currentIALogo = theme === 'light' ? iaLogoLight : iaLogo;

    const [allHistory, setAllHistory] = useState([]);
    const [sessionList, setSessionList] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(() => `chat_${Date.now()}`);
    const [messages, setMessages] = useState([{ role: 'assistant', content: t('ai_welcome') }]);
    const [loading, setLoading] = useState(true);

    const [chatServiceError, setChatServiceError] = useState(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState(null);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    const handleSpeakText = (text, index) => {
        if (window.speechSynthesis.speaking && speakingIndex === index) {
            window.speechSynthesis.cancel();
            setSpeakingIndex(null);
            return;
        }

        window.speechSynthesis.cancel();
        const cleanText = text.replace(/\*/g, '').replace(/#/g, '').replace(/\$/g, '').replace(/(\d),(?=\d)/g, '$1');
        const utterance = new SpeechSynthesisUtterance(cleanText);

        const isEnglish = language === 'en';
        utterance.lang = isEnglish ? 'en-US' : 'es-MX';

        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (isEnglish) {
            selectedVoice = voices.find(v =>
                v.lang.startsWith('en') &&
                (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))
            ) || voices.find(v => v.lang.startsWith('en'));
        } else {
            const femaleNames = ['Google español de Estados Unidos', 'Paulina', 'Sabina', 'Helena', 'Laura', 'Monica', 'Victoria', 'Mia'];
            selectedVoice = voices.find(v =>
                v.lang.startsWith('es') &&
                femaleNames.some(name => v.name.includes(name))
            );

            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('es'));
            }
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 1.1;
        utterance.pitch = 1.0;

        utterance.onend = () => setSpeakingIndex(null);
        utterance.onerror = () => setSpeakingIndex(null);

        setSpeakingIndex(index);
        window.speechSynthesis.speak(utterance);
    };

    const [attachedFile, setAttachedFile] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const prevSessionRef = useRef(currentSessionId);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [sessionIdToDelete, setSessionIdToDelete] = useState(null);

    // MODIFICACIÓN 1: Permitimos forzar la inyección de una sesión en la lista
    const loadChatHistory = async (sessionToForce = null) => {
        try {
            const res = await api.get('/chat');
            if (res.data && res.data.data) {
                const history = res.data.data;
                setAllHistory(history);

                let uniqueSessions = [...new Set(history.map(m => m.session_id))].reverse();

                // Si forzamos una sesión y no está en la base de datos aún, la inyectamos temporalmente
                if (sessionToForce && !uniqueSessions.includes(sessionToForce)) {
                    uniqueSessions = [sessionToForce, ...uniqueSessions];
                }

                setSessionList(uniqueSessions);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initVoices = () => { window.speechSynthesis.getVoices(); };
        initVoices();
        if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = initVoices;
        }

        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        window.speechSynthesis.cancel();
        setSpeakingIndex(null);
    }, [currentSessionId]);

    useEffect(() => {
        loadChatHistory();
    }, [t]);

    // MODIFICACIÓN 2: Protegemos la UI optimista de ser borrada
    useEffect(() => {
        const isNewSession = prevSessionRef.current !== currentSessionId;
        prevSessionRef.current = currentSessionId;

        const currentMessages = allHistory.filter(m => m.session_id === currentSessionId);

        if (currentMessages.length > 0) {
            setMessages(prev => {
                const dbMessages = [{ role: 'assistant', content: t('ai_welcome') }, ...currentMessages];
                if (isNewSession) return dbMessages;

                return dbMessages.map((msg, i) => {
                    if (prev[i] && prev[i].imageUrl) {
                        return { ...msg, imageUrl: prev[i].imageUrl };
                    }
                    return msg;
                });
            });
        } else {
            // Solo limpiamos si REALMENTE cambiamos de sesión y no hay mensajes
            if (isNewSession) {
                setMessages([{ role: 'assistant', content: t('ai_welcome') }]);
            }
        }
    }, [currentSessionId, allHistory, t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const startNewConversation = () => {
        setCurrentSessionId(`chat_${Date.now()}`);
        setMessages([{ role: 'assistant', content: t('ai_welcome') }]); // Forzamos limpieza local al instante
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

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
        if (!userText && !attachedFile) return;

        let finalMessageText = userText;
        if (attachedFile) {
            const attachmentText = `📎 ${attachedFile.name}`;
            finalMessageText = userText ? `${userText}\n\n${attachmentText}` : attachmentText;
        }

        // Inyectamos el ID en la lista de sesiones localmente AL INSTANTE para que no desaparezca
        setSessionList(prev => {
            if (!prev.includes(currentSessionId)) {
                return [currentSessionId, ...prev];
            }
            return prev;
        });

        setMessages(prev => [...prev, {
            role: 'user',
            content: finalMessageText,
            imageUrl: attachedFile?.preview || null
        }]);

        setInput('');
        const fileToSend = attachedFile;

        setAttachedFile(null);
        setIsTyping(true);
        setChatServiceError(null);

        try {
            const payload = {
                message: finalMessageText,
                sessionId: currentSessionId,
                fileBase64: fileToSend?.base64 || null,
                fileMimeType: fileToSend?.mimeType || null
            };
            const res = await api.post('/chat', payload);
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);

            // MODIFICACIÓN 3: Forzamos el ID de sesión actual al recargar el historial
            loadChatHistory(currentSessionId);

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
                <p key={index} className={`mb-1 ${theme === 'light' ? 'text-gray-900 font-medium' : 'text-gray-200'}`}>
                    {line.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i} className={`text-[#00D4FF] ${theme === 'light' ? '' : 'drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]'}`}>{part}</strong> : part
                    )}
                </p>
            );
        });
    };

    const formatSessionName = (id) => {
        const sessionMessages = allHistory.filter(m => m.session_id === id && m.role === 'user');

        // Si no hay historial aún, pero es la sesión actual, la llamamos "Nueva Conversación"
        if (sessionMessages.length === 0 && id === currentSessionId) {
            // Revisamos si en el estado LOCAL ya hay un mensaje del usuario
            const localUserMsgs = messages.filter(m => m.role === 'user');
            if (localUserMsgs.length > 0) {
                let title = localUserMsgs[0].content.trim();
                title = title.charAt(0).toUpperCase() + title.slice(1);
                return title.length > 28 ? title.substring(0, 28) + '...' : title;
            }
            return 'Nueva Conversación';
        }

        if (sessionMessages.length > 0) {
            let title = sessionMessages[0].content.trim();
            title = title.charAt(0).toUpperCase() + title.slice(1);
            return title.length > 28 ? title.substring(0, 28) + '...' : title;
        }
        return 'Nueva Conversación';
    };

    if (loading) return <GlobalLoader fullScreen={true} />;

    return (
        <div className={`flex h-[calc(100vh-5rem)] -m-4 md:-m-6 relative rounded-t-3xl overflow-hidden shadow-2xl z-10 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#05011a]'}`}>
            {/* SIDEBAR DINÁMICO */}
            <div className={`hidden md:flex flex-col w-64 border-r p-4 flex-shrink-0 relative z-20 shadow-[5px_0_20px_rgba(0,0,0,0.5)] ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#0a0520] border-white/5'}`}>
                <Link to="/" className={`transition-all mb-6 text-sm flex items-center gap-2 ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-finance-muted hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'}`}>
                    ← Volver a Mis Finanzas
                </Link>

                {/* BOTÓN "NUEVA CONVERSACIÓN" CON AURA BRILLANTE */}
                <div className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-[#8C30F5] to-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] transition-all duration-300 mb-6 cursor-pointer">
                    <button
                        onClick={startNewConversation}
                        className={`flex items-center gap-2 w-full p-3 rounded-[10px] transition-colors text-sm font-bold ${theme === 'light' ? 'bg-white text-gray-800 hover:bg-gray-50' : 'bg-[#0a0520] text-white hover:bg-[#110833]'}`}
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
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === sessionId ? (theme === 'light' ? 'bg-[#00D4FF]/10 border-[#00D4FF]/20 shadow-sm' : 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]') : (theme === 'light' ? 'bg-transparent hover:bg-gray-100 border-transparent' : 'bg-transparent hover:bg-white/5 border-transparent')}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare size={16} className={currentSessionId === sessionId ? "text-[#00D4FF] drop-shadow-[0_0_5px_rgba(0,212,255,0.8)]" : "text-gray-500"} />
                                <span className={`text-sm truncate ${currentSessionId === sessionId ? (theme === 'light' ? "text-gray-900 font-bold" : "text-white font-medium") : "text-gray-400"}`}>
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
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.6)] overflow-hidden p-[3px]">
                            <img src={currentIALogo} alt="IA" className={`w-full h-full object-cover rounded-full border-[3px] ${theme === 'light' ? 'border-black' : 'border-[#0a0520]'}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-lg font-bold leading-tight ${theme === 'light' ? 'text-gray-900' : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`}>Asistente IA</h2>
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
                                    <div className={`w-20 h-20 flex-shrink-0 rounded-full border border-white/10 flex items-center justify-center mt-auto overflow-hidden ${theme === 'light' ? 'bg-black shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'bg-[#11111d]'}`}>
                                        <img src={currentIALogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                                    </div>
                                ) : (
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-full border border-[#FF4DA6]/50 flex items-center justify-center mt-auto ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-[#0d0f1a] shadow-[0_0_15px_rgba(255,77,166,0.5)]'}`}>
                                        <User size={20} className="text-[#FF4DA6] drop-shadow-[0_0_5px_rgba(255,77,166,0.8)]" />
                                    </div>
                                )}

                                {/* BURBUJAS DE MENSAJE CON BORDES DEGRADADOS Y AURA */}
                                <div className={`p-[1.5px] rounded-3xl ${theme === 'light' ? 'shadow-sm' : 'shadow-[0_0_25px_rgba(0,0,0,0.5)]'} ${msg.role === 'user'
                                    ? 'bg-gradient-to-l from-[#8C30F5]/80 to-[#FF4DA6]/80 shadow-[0_0_20px_rgba(140,48,245,0.3)]' // Glow púrpura para usuario
                                    : 'bg-transparent'  // Sin Glow cian para IA
                                    }`}>
                                    <div className={`rounded-3xl ${theme === 'light' ? 'shadow-sm' : 'shadow-[0_0_25px_rgba(0,0,0,0.5)]'} ${msg.role === 'user'
                                        ? 'bg-gradient-to-l from-[#8C30F5]/80 to-[#FF4DA6]/80 p-[1.5px]' // Glow user
                                        : 'bg-transparent'  // Borde simple asistente
                                        }`}>
                                        <div className={`p-5 rounded-[22px] ${msg.role === 'user'
                                            ? (theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'bg-[#150a26]/95 text-white')
                                            : (theme === 'light' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'bg-[#05011a]/95 text-gray-200 border border-white/10')
                                            }`}>

                                            {/* NUEVO: Dibujar la imagen del ticket o el botón del archivo si existe */}
                                            {(msg.imageUrl || msg.image_url) && (
                                                ((msg.imageUrl || msg.image_url).match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || (msg.imageUrl || msg.image_url).startsWith('blob:')) ? (
                                                    <img
                                                        src={msg.imageUrl || msg.image_url}
                                                        alt="Archivo adjunto"
                                                        onClick={() => setFullscreenImage(msg.imageUrl || msg.image_url)}
                                                        className="w-full max-w-[250px] h-auto object-contain rounded-lg mb-3 border border-white/20 shadow-md transition-all hover:scale-105 cursor-pointer"
                                                    />
                                                ) : (
                                                    <a
                                                        href={msg.imageUrl || msg.image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-[#8C30F5]/20 hover:bg-[#8C30F5]/40 border border-[#8C30F5]/50 rounded-xl transition-all mb-3 text-white text-sm shadow-[0_0_15px_rgba(140,48,245,0.3)] hover:shadow-[0_0_25px_rgba(140,48,245,0.6)]"
                                                    >
                                                        <FileText size={20} className="text-[#00D4FF]" />
                                                        Ver documento adjunto
                                                    </a>
                                                )
                                            )}
                                            {/* Renderizado de texto normal */}
                                            <div className="text-[15px] leading-relaxed">
                                                {renderContent(msg.content)}
                                            </div>

                                            {/* NUEVO: BOTÓN DE VOZ SOLO PARA LA IA */}
                                            {msg.role === 'assistant' && (
                                                <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                                                    <button
                                                        onClick={() => handleSpeakText(msg.content, idx)}
                                                        className={`p-1.5 rounded-full transition-all duration-300 ${speakingIndex === idx
                                                            ? 'bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.4)] animate-pulse'
                                                            : 'text-gray-500 hover:text-[#00D4FF] hover:bg-[#00D4FF]/10'
                                                            }`}
                                                        title={speakingIndex === idx ? "Detener audio" : "Leer en voz alta"}
                                                    >
                                                        {speakingIndex === idx ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                                    </button>
                                                </div>
                                            )}
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
                <div className={`shrink-0 px-4 md:px-20 pb-2 pt-4 relative z-20 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#05011a]'}`}>
                    <div className={`absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t pointer-events-none ${theme === 'light' ? 'from-slate-50' : 'from-[#05011a]'}`}></div>

                    {/* BURBUJA DE PREVIEW DEL ARCHIVO ADJUNTO */}
                    {attachedFile && (
                        <div className="mx-auto max-w-4xl mb-2 flex items-center gap-3 p-2 bg-[#8C30F5]/20 border border-[#8C30F5]/50 rounded-xl w-max shadow-[0_0_15px_rgba(140,48,245,0.3)] animate-fade-in">
                            {attachedFile.preview ? (
                                <img src={attachedFile.preview} alt="preview" className="w-10 h-10 rounded border border-white/20 object-cover" />
                            ) : (
                                <FileText size={28} className="text-[#00D4FF] p-1 bg-black/40 rounded" />
                            )}
                            <span className={`text-xs truncate max-w-[150px] font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{attachedFile.name}</span>
                            <button onClick={() => setAttachedFile(null)} className="text-red-400 hover:text-red-300 ml-2 p-1 hover:bg-red-400/20 rounded transition-colors" title="Quitar archivo">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* CONTENEDOR DE LA CAJA DE TEXTO CON EFECTO DE LUZ */}
                    <div className="mx-auto max-w-4xl relative rounded-3xl p-[1.5px] bg-gradient-to-r from-[#00D4FF] via-[#8C30F5] to-[#FF4DA6] shadow-[0_0_30px_rgba(140,48,245,0.4)] focus-within:shadow-[0_0_50px_rgba(0,212,255,0.6)] transition-all duration-500">

                        <form
                            onSubmit={handleSubmit}
                            className={`backdrop-blur-3xl rounded-[22px] p-3 flex flex-col w-full h-full ${theme === 'light' ? 'bg-white border border-gray-200 shadow-sm' : 'bg-[#0b061c]/95'}`}
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
                                className={`w-full bg-transparent border-none px-4 py-3 text-lg leading-relaxed focus:outline-none focus:ring-0 disabled:opacity-50 mb-2 resize-none overflow-y-auto ${theme === 'light' ? 'text-gray-900 placeholder:text-gray-400' : 'text-white drop-shadow-md placeholder:text-gray-500/70'}`}
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
                                            ? 'bg-[#FF4DA6]/20 text-[#FF4DA6] shadow-[0_0_20px_rgba(255,77,166,0.8)] animate-pulse border border-[#FF4DA6]/50'
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
                                    className="w-11 h-11 rounded-full bg-gradient-to-r from-[#8C30F5] to-[#FF4DA6] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-[0_0_20px_rgba(255,77,166,0.6)] hover:shadow-[0_0_30px_rgba(255,77,166,0.9)] hover:scale-105 border border-white/20"
                                >
                                    <Send size={18} className="ml-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className={`text-center text-[11px] mt-4 font-medium tracking-widest uppercase ${theme === 'light' ? 'text-[#00D4FF]' : 'text-[#00D4FF]/60 drop-shadow-[0_0_5px_rgba(0,212,255,0.3)]'}`}>
                        Mente Billete AI puede cometer errores. Verifica las transacciones.
                    </p>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md" onClick={handleCancelDelete}>
                    {/* Modal con aura roja */}
                    <div
                        className="relative rounded-3xl p-[1.5px] w-full max-w-md bg-gradient-to-tr from-[#FF4DA6]/80 to-[#8C30F5]/50 shadow-[0_0_40px_rgba(255,77,166,0.4)] transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`rounded-[22px] p-6 w-full h-full ${theme === 'light' ? 'bg-white' : 'bg-[#0b061c]'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-[#FF4DA6]/20 p-4 rounded-full text-[#FF4DA6] shadow-[0_0_15px_rgba(255,77,166,0.5)] border border-[#FF4DA6]/30">
                                    <Trash2 size={24} className="drop-shadow-[0_0_5px_currentColor]" />
                                </div>
                                <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`}>
                                    ¿Estás seguro que quieres borrar este chat?
                                </h3>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={handleCancelDelete}
                                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${theme === 'light' ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="bg-gradient-to-r from-[#FF4DA6] to-[#8C30F5] hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(255,77,166,0.6)] hover:shadow-[0_0_25px_rgba(255,77,166,0.9)]"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PARA IMAGEN EN PANTALLA COMPLETA */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out animate-fade-in"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        onClick={() => setFullscreenImage(null)}
                        title="Cerrar pantalla completa"
                    >
                        <X size={28} />
                    </button>
                    <img
                        src={fullscreenImage}
                        alt="Pantalla completa"
                        className="max-w-[95%] max-h-[90vh] object-contain rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}