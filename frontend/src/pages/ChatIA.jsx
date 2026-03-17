import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, User, Sparkles, MessageSquare, Plus, Trash2, Search, Filter, Menu, X, Star, Mic, Paperclip, FileText } from 'lucide-react';
import api from '../services/api';
import iaLogo from '../assets/Imagen pegada.png';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function GrowthChart({ data }) {
    if (!data || data.length === 0) return null;
    const chartData = {
        labels: data.map((_, i) => i),
        datasets: [{
            data: data, borderColor: '#00D4FF', backgroundColor: 'rgba(0, 212, 255, 0.1)',
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
        }]
    };
    const options = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
    };
    return <div className="h-16 w-full mt-2"><Line data={chartData} options={options} /></div>;
}

function TypingBubble() {
    return (
        <div className="flex justify-start">
            <div className="flex max-w-[70%] gap-4 flex-row">
                <div className={`w-12 h-12 flex-shrink-0 rounded-full ${isLight ? 'bg-white border-blue-200' : 'bg-[#11111d] border-[#8C30F5]/50'} border flex items-center justify-center overflow-hidden p-0.5 shadow-[0_0_20px_rgba(140,48,245,0.6)]`}>
                    <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="p-[1.5px] rounded-2xl rounded-bl-sm bg-gradient-to-r from-[#00D4FF]/80 to-[#8C30F5]/80 shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                    <div className={`p-4 rounded-[15px] rounded-bl-sm ${isLight ? 'bg-white' : 'bg-[#05011a]/95'} flex items-center gap-1.5 backdrop-blur-md`}>
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
    const { theme } = useTheme();
    const isLight = theme === 'light';

    
    // Sesiones y Mensajes
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    
    // Estados de Input
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const [recognitionObj, setRecognitionObj] = useState(null);
    
    // UI Helpers
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIntent, setFilterIntent] = useState('all');
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null });
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // 1. Cargar Sesiones
    const fetchData = async () => {
        try {
            const res = await api.get('/chat/sessions');
            const sessionData = res.data.data;
            setSessions(sessionData);
            if (sessionData.length > 0 && !currentSessionId) {
                setCurrentSessionId(sessionData[0].id);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Cargar Historial al cambiar de sesión
    useEffect(() => {
        if (!currentSessionId) return;
        const loadHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${currentSessionId}`);
                if (res.data.data.length > 0) {
                    setMessages(res.data.data);
                } else {
                    setMessages([{ role: 'assistant', content: t('ai_welcome') }]);
                }
            } catch (error) {
                console.error("Error loading chat history:", error);
            }
        };
        loadHistory();
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [currentSessionId, t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleNewChat = async () => {
        try {
            const res = await api.post('/chat/sessions', { title: 'Nueva Conversación' });
            setSessions([res.data.data, ...sessions]);
            setCurrentSessionId(res.data.data.id);
            setMessages([{ role: 'assistant', content: t('ai_welcome') }]);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (error) {
            console.error("Error creating new chat:", error);
        }
    };

    const confirmAction = (title, message, onConfirm) => {
        setModal({ show: true, title, message, onConfirm: () => { onConfirm(); setModal(prev => ({ ...prev, show: false })); } });
    };

    const deleteSession = async (id, e) => {
        e.stopPropagation();
        confirmAction(
            "Eliminar Conversación",
            "¿Estás seguro de que deseas borrar este chat? No podrás recuperar los mensajes.",
            async () => {
                try {
                    await api.delete(`/chat/sessions/${id}`);
                    const updated = sessions.filter(s => s.id !== id);
                    setSessions(updated);
                    if (currentSessionId === id) {
                        setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
                    }
                } catch (error) {
                    console.error("Error deleting session:", error);
                }
            }
        );
    };

    const clearAll = () => {
        confirmAction(
            "LIMPIAR TODO EL HISTORIAL",
            "Esta acción eliminará TODOS tus chats guardados. ¡Es definitiva!",
            async () => {
                try {
                    await Promise.all(sessions.map(s => api.delete(`/chat/sessions/${s.id}`)));
                    setSessions([]);
                    setCurrentSessionId(null);
                    setMessages([{ role: 'assistant', content: t('ai_welcome') }]);
                } catch (error) {
                    console.error("Error clearing all sessions:", error);
                }
            }
        );
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
        recognition.onstart = () => { setIsListening(true); setRecognitionObj(recognition); };
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
        recognition.onerror = () => { setIsListening(false); setRecognitionObj(null); };
        recognition.onend = () => { setIsListening(false); setRecognitionObj(null); };
        try { recognition.start(); } catch (error) { console.error(error); }
    };

    const sendMessage = async (text) => {
        const userText = text.trim();
        if (!userText && !attachedFile) return;

        setMessages(prev => [...prev, { 
            role: 'user', 
            content: userText || "*(Documento adjunto)*", 
            imageUrl: attachedFile?.preview || null,
            created_at: new Date() 
        }]);
        
        setInput('');
        const fileToSend = attachedFile;
        setAttachedFile(null);
        setIsTyping(true);

        try {
            const payload = {
                message: userText,
                sessionId: currentSessionId,
                fileBase64: fileToSend?.base64 || null,
                fileMimeType: fileToSend?.mimeType || null
            };
            const res = await api.post('/chat', payload);

            // Si es nueva conversación, el título puede haber cambiado en el backend
            if (sessions.find(s => s.id === currentSessionId)?.title === 'Nueva Conversación') {
                setTimeout(fetchData, 2000);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.data.reply,
                intent: res.data.intent,
                data: res.data.data,
                created_at: new Date()
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: t('ai_error') }]);
        } finally {
            setIsTyping(false);
        }
    };

    const renderContent = (content) => {
        if (!content) return null;
        return content.split('\n').map((line, index) => {
            if (line.trim() === '') return <div key={index} className="h-2"></div>;
            return (
                <p key={index} className="mb-1">
                    {line.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i} className="text-[#00D4FF] drop-shadow-[0_0_8px_rgba(0,212,255,0.6)]">{part}</strong> : part
                    )}
                </p>
            );
        });
    };

    const filteredMessages = messages.filter(m => {
        const matchesSearch = (m.content || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIntent = filterIntent === 'all' || m.intent === filterIntent;
        return matchesSearch && matchesIntent;
    });

    return (
        <div className={`flex h-[calc(100vh-8rem)] -m-4 md:-m-6 ${isLight ? 'bg-slate-50' : 'bg-[#05011a]'} overflow-hidden rounded-3xl border ${isLight ? 'border-slate-200 shadow-xl' : 'border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]'}`}>
            {/* SIDEBAR */}
            <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} md:relative fixed inset-y-0 left-0 z-50 h-full ${isLight ? 'bg-white border-r border-slate-200' : 'bg-[#0a0520] border-r border-white/5'} transition-all duration-300 flex flex-col overflow-hidden shadow-2xl md:shadow-none`}>
                <div className="p-4 flex flex-col h-full flex-shrink-0 w-80">
                    <div className={`relative rounded-xl p-[1.5px] bg-gradient-to-r from-[#8C30F5] to-[#00D4FF] ${isLight ? 'shadow-lg' : 'shadow-[0_0_20px_rgba(0,212,255,0.3)]'} hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] transition-all mb-4 cursor-pointer`}>
                        <button onClick={handleNewChat} className={`flex items-center gap-2 w-full ${isLight ? 'bg-white text-slate-800' : 'bg-[#0a0520] text-white'} p-3 rounded-[10px] font-bold transition-all text-sm`}>
                            <Plus size={18} /> Nuevo Chat
                        </button>
                    </div>

                    <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-finance-muted" size={14} />
                        <input type="text" placeholder="Buscar mensajes..." className={`w-full ${isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-white'} border rounded-lg pl-9 pr-4 py-2 text-xs focus:border-finance-primary outline-none`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                        {sessions.map(s => (
                            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${currentSessionId === s.id ? (isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/10 border-white/20') : 'hover:bg-white/5 border-transparent'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MessageSquare size={16} className={currentSessionId === s.id ? 'text-[#00D4FF]' : (isLight ? 'text-slate-400' : 'text-gray-500')} />
                                    <span className={`text-sm truncate ${currentSessionId === s.id ? (isLight ? 'text-slate-900 font-bold' : 'text-white font-medium') : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>{s.title}</span>
                                </div>
                                <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-400/20 rounded-lg transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button onClick={clearAll} className="mt-2 flex items-center justify-center gap-2 w-full py-2 text-[10px] font-bold text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest">
                        <Trash2 size={12} /> Limpiar Historial
                    </button>
                </div>
            </aside>

            {/* CHAT AREA */}
            <main className="flex-1 flex flex-col relative min-w-0 h-full">
                <header className="px-6 py-4 bg-transparent border-b border-white/5 flex items-center justify-between z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-finance-muted">
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center p-[1px] shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                                <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div>
                                <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'} leading-tight`}>MenteBillete AI</h2>
                                <span className="text-[10px] text-[#00D4FF] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" /> {t('connected_data')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`hidden sm:flex items-center gap-1 text-[10px] ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-[#4F46E5]/20 text-[#00D4FF]'} px-2 py-0.5 rounded-full font-bold border ${isLight ? 'border-blue-200' : 'border-[#00D4FF]/40'}`}>
                            <Sparkles size={9} /> Gemini
                        </span>
                        <select value={filterIntent} onChange={e => setFilterIntent(e.target.value)} className={`${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-black/40 border-white/10 text-finance-muted'} rounded-lg px-2 py-1 text-[10px] outline-none`}>
                            <option value="all">Filtros</option>
                            <option value="registrar_movimiento">Registros</option>
                            <option value="asesoramiento_inversion">Inversiones</option>
                        </select>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:px-20 space-y-6 scrollbar-hide">
                    {filteredMessages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center mt-auto border ${msg.role === 'assistant' ? (isLight ? 'bg-white border-blue-200 shadow-sm' : 'bg-[#11111d] border-[#00D4FF]/50 shadow-[0_0_10px_rgba(0,212,255,0.3)]') : (isLight ? 'bg-white border-pink-200 shadow-sm' : 'bg-[#0d0f1a] border-[#E600E6]/50 shadow-[0_0_10px_rgba(230,0,230,0.3)]')}`}>
                                    {msg.role === 'assistant' ? <img src={iaLogo} className="w-full h-full object-cover rounded-full" /> : <User size={18} className="text-[#E600E6]" />}
                                </div>
                                <div className={`p-[1.5px] rounded-3xl ${msg.role === 'user' ? 'bg-gradient-to-l from-[#8C30F5]/80 to-[#E600E6]/80' : 'bg-gradient-to-r from-[#00D4FF]/80 to-[#8C30F5]/80'}`}>
                                    <div className={`p-5 rounded-[22px] ${msg.role === 'user' ? (isLight ? 'bg-white text-slate-800 border border-slate-100' : 'bg-[#150a26]/95 text-white') : (isLight ? 'bg-white text-slate-800 border border-slate-100 shadow-sm' : 'bg-[#05011a]/95 text-gray-200 shadow-inner')}`}>
                                        {msg.imageUrl && (
                                            <img src={msg.imageUrl} alt="Documento" className="w-full max-w-[240px] rounded-xl mb-3 border border-white/20" />
                                        )}
                                        <div className="text-[14px] leading-relaxed">
                                            {renderContent(msg.content)}
                                        </div>
                                        
                                        {msg.data?.new_balance_neto && (
                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                                    <p className="text-[9px] text-finance-muted uppercase font-bold">Proyectado</p>
                                                    <p className="font-bold text-white text-base">${Number(msg.data.new_balance_neto).toLocaleString()}</p>
                                                </div>
                                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                                    <p className="text-[9px] text-finance-muted uppercase font-bold">Colchón</p>
                                                    <p className="font-bold text-white text-base">{msg.data.new_dias_colchon_financiero} días</p>
                                                </div>
                                            </div>
                                        )}

                                        {msg.data?.investment_options?.map((opt, i) => (
                                            <div key={i} className="mt-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className="flex justify-between text-xs font-bold mb-1">
                                                    <span>{opt.tool}</span>
                                                    <span className="text-emerald-400">{opt.yield}</span>
                                                </div>
                                                {opt.chart_data && <GrowthChart data={opt.chart_data} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && <TypingBubble />}
                    <div ref={messagesEndRef} />
                </div>

                <div className={`shrink-0 px-4 md:px-20 pb-4 pt-4 ${isLight ? 'bg-slate-50 border-t border-slate-200' : 'bg-[#05011a]'}`}>
                    {attachedFile && (
                        <div className="mx-auto max-w-4xl mb-3 flex items-center gap-3 p-2 bg-[#8C30F5]/20 border border-[#8C30F5]/50 rounded-xl w-max animate-fade-in shadow-lg">
                            {attachedFile.preview ? (
                                <img src={attachedFile.preview} className="w-10 h-10 rounded border border-white/20 object-cover" alt="preview" />
                            ) : <FileText size={20} className="text-[#00D4FF]" />}
                            <span className="text-xs text-white truncate max-w-[150px]">{attachedFile.name}</span>
                            <button onClick={() => setAttachedFile(null)} className="text-red-400 ml-2"><X size={16} /></button>
                        </div>
                    )}

                    <div className={`mx-auto max-w-4xl relative rounded-3xl p-[1.5px] bg-gradient-to-r from-[#00D4FF] via-[#8C30F5] to-[#E600E6] ${isLight ? 'shadow-xl' : 'shadow-[0_0_30px_rgba(140,48,245,0.4)]'} transition-all`}>
                        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className={`${isLight ? 'bg-white' : 'bg-[#0b061c]/95'} rounded-[22px] p-2 flex flex-col`}>
                            <input type="file" accept="image/*,application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                <textarea
                                    value={input}
                                    onChange={e => { setInput(e.target.value); e.target.style.height = '56px'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                                    className={`w-full bg-transparent border-none px-4 py-3 ${isLight ? 'text-slate-800' : 'text-white'} text-[16px] outline-none resize-none min-h-[56px] max-h-[120px]`}
                                    placeholder={isListening ? 'Escuchando...' : 'Escribe o sube un ticket...'}
                                />
                            <div className="flex justify-between items-center px-2 pb-1">
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full bg-[#8C30F5]/10 text-[#8C30F5] border border-[#8C30F5]/30">
                                        <Paperclip size={18} />
                                    </button>
                                    <button type="button" onClick={handleVoiceInput} className={`p-2.5 rounded-full ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30'}`}>
                                        <Mic size={18} />
                                    </button>
                                </div>
                                <button type="submit" disabled={(!input.trim() && !attachedFile) || isTyping} className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8C30F5] to-[#E600E6] flex items-center justify-center text-white shadow-lg">
                                    <Send size={16} className="ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* MODAL ELIMINAR */}
            {modal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setModal({ ...modal, show: false })}>
                    <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0520] border-red-500/30'} border p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-scale-in`} onClick={e => e.stopPropagation()}>
                        <div className="bg-red-500/20 p-4 rounded-full w-fit mx-auto mb-4 border border-red-500/40">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'} text-center mb-2`}>{modal.title}</h3>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-gray-400'} text-center mb-8`}>{modal.message}</p>
                        <div className="flex gap-4">
                            <button onClick={() => setModal({ ...modal, show: false })} className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Cancelar</button>
                            <button onClick={modal.onConfirm} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold shadow-[0_0_20px_rgba(230,0,0,0.4)] hover:bg-red-500 transition-all">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}