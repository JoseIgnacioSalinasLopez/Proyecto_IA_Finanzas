import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, User, Sparkles, MessageSquare, Plus, Trash2, Search, Filter, Menu, X, Star } from 'lucide-react';
import api from '../services/api';
import iaLogo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
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

export default function ChatIA() {
    const { t } = useLanguage();
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasGemini, setHasGemini] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIntent, setFilterIntent] = useState('all');
    const [stats, setStats] = useState(null);
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // 1. Cargar Sesiones y Stats
    const fetchData = async () => {
        try {
            const [sessionsRes, statsRes] = await Promise.all([
                api.get('/chat/sessions'),
                api.get('/stats/dashboard')
            ]);
            setSessions(sessionsRes.data.data);
            setStats(statsRes.data.data);
            if (sessionsRes.data.data.length > 0 && !currentSessionId) {
                setCurrentSessionId(sessionsRes.data.data[0].id);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
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

    const sendMessage = async (text) => {
        const userText = text.trim();
        if (!userText) return;

        setMessages(prev => [...prev, { role: 'user', content: userText, created_at: new Date() }]);
        setInput('');
        setIsTyping(true);

        try {
            if (hasGemini) {
                try {
                    const res = await api.post('/chat', { message: userText, sessionId: currentSessionId });

                    if (sessions.find(s => s.id === (currentSessionId || res.data.sessionId))?.title === 'Nueva Conversación') {
                        setTimeout(fetchData, 2000);
                    }

                    if (!currentSessionId) setCurrentSessionId(res.data.sessionId);

                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: res.data.reply,
                        intent: res.data.intent,
                        data: res.data.data,
                        created_at: new Date()
                    }]);
                } catch (err) {
                    if (err.response?.status === 429) {
                        setHasGemini(false);
                        const reply = localFallback(userText);
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `⚠️ **Modo Básico Activado**: Cuota de Gemini agotada. Seguiré en modo offline.\n\n${reply}`,
                            created_at: new Date()
                        }]);
                    } else throw err;
                }
            } else {
                const reply = localFallback(userText);
                setMessages(prev => [...prev, { role: 'assistant', content: reply, created_at: new Date() }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: t('ai_error'), created_at: new Date() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const localFallback = (text) => {
        const txt = text.toLowerCase();
        const summary = stats?.summary;

        if (txt.includes('saldo') || txt.includes('dinero') || txt.includes('cuanto tengo')) {
            if (!summary) return "Lo siento, no puedo acceder a tu saldo en este momento.";
            return `Tu saldo actual es de **$${summary.balance.toLocaleString()}**. Tienes un colchón financiero de aproximadamente **${summary.bufferTime} días** basándome en tus gastos recientes.`;
        }

        if (txt.includes('gasto') || txt.includes('gastado') || txt.includes('mes')) {
            if (!summary) return "En mi memoria local veo que tus gastos están controlados, pero no tengo la cifra exacta ahora mismo.";
            return `Este mes has gastado **$${summary.totalSpentThisMonth.toLocaleString()}** de un presupuesto total de **$${summary.totalBudget.toLocaleString()}**. Vas al **${Math.round((summary.totalSpentThisMonth / summary.totalBudget) * 100)}%** de tu límite.`;
        }

        if (txt.includes('hola') || txt.includes('quien eres')) {
            return "¡Hola! Soy tu asistente financiero en **Modo Básico**. Aunque Gemini está descansando, puedo darte info rápida sobre tu saldo y gastos actuales.";
        }

        return "Gemini está fuera de línea. Puedo responderte sobre tu **saldo**, **gastos del mes** o **bienvenida**, pero para análisis complejos necesitaremos esperar a que se restablezca la conexión.";
    };

    const renderContent = (content) => {
        if (!content) return null;
        return content.split('**').map((part, i) =>
            i % 2 === 1 ? <strong key={part + i} className="text-[#00D4FF]">{part}</strong> : part
        );
    };

    const filteredMessages = messages.filter(m => {
        const matchesSearch = (m.content || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIntent = filterIntent === 'all' || m.intent === filterIntent;
        return matchesSearch && matchesIntent;
    });

    // Sub-componente de Modal Estilizado
    const ConfirmModal = () => (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${modal.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal({ ...modal, show: false })} />
            <div className="relative bg-[#1a1a2e] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-sm w-full transform transition-all scale-100 border-t-finance-primary/30">
                <h3 className="text-lg font-bold text-white mb-2">{modal.title}</h3>
                <p className="text-sm text-finance-muted mb-6 leading-relaxed">{modal.message}</p>
                <div className="flex gap-3">
                    <button onClick={() => setModal({ ...modal, show: false })} className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all">Cancelar</button>
                    <button onClick={modal.onConfirm} className="flex-1 px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-all">Confirmar</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6 bg-[#0f0f1a] overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
            {/* SIDEBAR */}
            <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} md:relative fixed inset-y-0 left-0 z-50 h-full bg-[#161625] border-r border-white/5 transition-all duration-300 flex flex-col overflow-hidden shadow-2xl md:shadow-none`}>
                <div className="p-4 flex flex-col h-full flex-shrink-0 w-80">
                    <button onClick={handleNewChat} className="flex items-center gap-2 w-full bg-finance-primary/20 hover:bg-finance-primary/30 text-finance-primary border border-finance-primary/30 p-3 rounded-xl font-bold transition-all mb-4 overflow-hidden whitespace-nowrap">
                        <Plus size={18} /> Nuevo Chat
                    </button>

                    <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-finance-muted" size={14} />
                        <input type="text" placeholder="Buscar mensajes..." className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:border-finance-primary outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                        {sessions.map(s => (
                            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MessageSquare size={16} className={currentSessionId === s.id ? 'text-finance-primary' : 'text-finance-muted'} />
                                    <span className={`text-sm truncate ${currentSessionId === s.id ? 'text-white font-medium' : 'text-finance-muted'}`}>{s.title}</span>
                                </div>
                                <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={clearAll}
                        className="mt-2 flex items-center justify-center gap-2 w-full py-2 text-[10px] font-bold text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest"
                    >
                        <Trash2 size={12} /> Limpiar Todo
                    </button>

                    <div className="pt-4 border-t border-white/5 mt-auto flex-shrink-0">
                        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex-shrink-0" />
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-white truncate">Usuario Pro</p>
                                <p className="text-[10px] text-finance-muted">Plan Elite</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* CHAT AREA */}
            <main className="flex-1 flex flex-col relative min-w-0 h-full">
                <header className="px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-finance-muted">
                            <Menu size={20} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold truncate max-w-[200px]">
                                {sessions.find(s => s.id === currentSessionId)?.title || 'Asistente IA'}
                            </h2>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-2 mr-2">
                            {hasGemini ? (
                                <span className="flex items-center gap-1 text-[10px] bg-[#4F46E5]/20 text-[#8C8FFF] px-2 py-0.5 rounded-full font-bold border border-[#4F46E5]/30">
                                    <Sparkles size={9} /> Gemini
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] bg-white/10 text-finance-muted px-2 py-0.5 rounded-full font-bold border border-white/10">
                                    Modo Básico
                                </span>
                            )}
                        </div>
                        <select value={filterIntent} onChange={e => setFilterIntent(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-finance-muted outline-none">
                            <option value="all">Todos los tipos</option>
                            <option value="registrar_movimiento">Registros</option>
                            <option value="asesoramiento_inversion">Inversiones</option>
                            <option value="analizar_impacto">Análisis What-If</option>
                        </select>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin">
                    {filteredMessages.length === 0 && searchQuery && (
                        <div className="text-center py-20 text-finance-muted">No se encontraron mensajes con "{searchQuery}"</div>
                    )}
                    {filteredMessages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[90%] md:max-w-[75%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mt-auto ${msg.role === 'assistant' ? 'bg-finance-800 border border-finance-primary/30 p-0.5' : 'bg-finance-700'}`}>
                                    {msg.role === 'assistant' ? <img src={iaLogo} className="w-full h-full object-cover rounded-full" /> : <User size={16} />}
                                </div>
                                <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-2xl text-sm shadow-xl ${msg.role === 'user' ? 'bg-gradient-to-br from-[#8C30F5] to-[#4F46E5] text-white rounded-br-sm' : 'bg-[#1e1e2d] border border-white/5 text-finance-text rounded-bl-sm'}`}>
                                        {renderContent(msg.content)}

                                        {/* ETIQUETA INTELIGENTE: Posible Deducible */}
                                        {(msg.intent === 'identificador_deducible' || (msg.intent === 'registrar_movimiento' && msg.content?.toLowerCase().includes('deducible'))) && (
                                            <div className="mt-3 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/30 w-fit">
                                                <Sparkles size={12} className="animate-pulse" />
                                                <span className="font-bold text-[10px] uppercase tracking-wider">Posible Deducible</span>
                                            </div>
                                        )}

                                        {/* Pronóstico y Impacto What-If */}
                                        {msg.data && (
                                            <div className="mt-4 space-y-3">
                                                {msg.data.new_balance_neto !== undefined && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-black/20 p-3 rounded-xl">
                                                            <p className="text-[10px] text-finance-muted uppercase font-bold tracking-tight">Balance Proyectado</p>
                                                            <p className="font-bold text-finance-text text-lg">${Number(msg.data.new_balance_neto).toLocaleString()}</p>
                                                        </div>
                                                        <div className={`p-3 rounded-xl ${msg.data.new_dias_colchon_financiero < 10 ? 'bg-red-500/20' : 'bg-black/20'}`}>
                                                            <p className="text-[10px] text-finance-muted uppercase font-bold tracking-tight">Días de Colchón</p>
                                                            <p className={`font-bold text-lg ${msg.data.new_dias_colchon_financiero < 10 ? 'text-red-400' : 'text-finance-text'}`}>{msg.data.new_dias_colchon_financiero} días</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {msg.data.investment_options?.map((opt, i) => (
                                                    <div key={i} className="bg-gradient-to-r from-finance-primary/10 to-transparent p-3 rounded-xl border border-white/5">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-bold text-white">{opt.tool}</span>
                                                            <span className="text-xs text-emerald-400">{opt.yield}</span>
                                                        </div>
                                                        <p className="text-[10px] text-finance-muted mb-2">Inversión sugerida: ${opt.amount}</p>
                                                        {opt.chart_data && <GrowthChart data={opt.chart_data} />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-finance-muted px-2">{new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && <div className="flex gap-4"><div className="w-8 h-8 flex-shrink-0 rounded-full bg-finance-800 p-0.5"><img src={iaLogo} className="w-full h-full rounded-full" /></div><div className="bg-white/5 p-4 rounded-2xl animate-pulse text-xs text-finance-muted">Escribiendo...</div></div>}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="p-4 bg-[#161625] border-t border-white/5">
                    <div className="max-w-4xl mx-auto flex gap-3">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            type="text"
                            placeholder="Hazme una pregunta sobre tus finanzas..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-full px-6 py-3 text-sm focus:border-finance-primary outline-none transition-all"
                        />
                        <button type="submit" disabled={!input.trim() || isTyping} className="w-12 h-12 rounded-full bg-finance-primary flex items-center justify-center text-white shadow-lg hover:brightness-110 active:scale-95 transition-all">
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </main>
            <ConfirmModal />
        </div>
    );
}