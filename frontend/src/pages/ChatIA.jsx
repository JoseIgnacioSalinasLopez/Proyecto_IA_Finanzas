import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import iaLogo from '../assets/Imagen pegada.png';

export default function ChatIA() {
    const [messages, setMessages] = useState([
        {
            role: 'system',
            content: '¡Hola! Soy ChatIA, tu asistente financiero. Puedo decirte tu "total de gastos", "total de ingresos" o "balance". ¿En qué te puedo ayudar hoy?'
        }
    ]);
    const [input, setInput] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats');
                setStats(res.data.data);
            } catch (error) {
                console.error("Error cargando estadísticas para ChatIA:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || loading || !stats) return;

        const userMsg = input.trim();
        // Add User Message
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');

        // Simulate IA Processing
        setTimeout(() => {
            const reply = generateIAReply(userMsg.toLowerCase(), stats);
            setMessages(prev => [...prev, { role: 'system', content: reply }]);
        }, 600); // Small delay to simulate thinking
    };

    const generateIAReply = (text, currentStats) => {
        const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

        // Simple NLP Simulation based on keywords
        if (text.includes('gasto') || text.includes('gastos')) {
            return `Tus gastos totales registrados son de **${formatCurrency(currentStats.summary.totalExpense)}**. Si necesitas saber de una categoría específica, dímelo.`;
        }
        if (text.includes('ingreso') || text.includes('ingresos') || text.includes('ganancia') || text.includes('gane')) {
            return `Tus ingresos totales según el registro actual son de **${formatCurrency(currentStats.summary.totalIncome)}**. ¡Sigue así!`;
        }
        if (text.includes('balance') || text.includes('dinero tengo') || text.includes('total')) {
            const isNegative = currentStats.summary.balance < 0;
            const balanceText = formatCurrency(currentStats.summary.balance);
            return `Tu balance neto actual es de **${balanceText}**. ${isNegative ? 'Uy, ten cuidado con esos números rojos.' : '¡Todo parece en orden!'}`;
        }

        return "Disculpa, no entendí completamente eso. Como IA Beta, actualmente respondo mejor a consultas exactas sobre tus 'gastos', 'ingresos' o tu 'balance' general.";
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-finance-900 -m-4 md:-m-6 relative rounded-t-3xl overflow-hidden shadow-2xl">
            {/* Cabecera del Chat */}
            <header className="bg-finance-800 border-b border-finance-700/50 flex items-center gap-4 px-6 py-4 flex-shrink-0 z-10 shadow-lg">
                <Link to="/" className="text-finance-muted hover:text-finance-text transition-colors p-2 hover:bg-white/5 rounded-full">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)] overflow-hidden p-[2px]">
                        <img src={iaLogo} alt="IA Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-finance-text leading-tight">ChatIA</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-finance-primary animate-pulse"></span>
                            <p className="text-xs text-finance-primary">En línea</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Zona de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 #0B022D' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] md:max-w-[70%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                            {/* Avatar */}
                            {msg.role === 'system' ? (
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-finance-800 border border-[#00D4FF]/30 flex items-center justify-center mt-auto overflow-hidden p-0.5">
                                    <img src={iaLogo} alt="IA Logo" className="w-full h-full object-cover rounded-full" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-finance-700 flex items-center justify-center mt-auto">
                                    <User size={16} className="text-finance-text" />
                                </div>
                            )}

                            {/* Burbuja */}
                            <div className={`p-4 rounded-2xl md:text-md text-sm shadow-md ${msg.role === 'user'
                                ? 'bg-[#4F46E5] text-white rounded-br-sm'
                                : 'bg-finance-800 border border-finance-700 text-finance-text rounded-bl-sm'
                                }`}>
                                {/* Basic markdown bolder parser if needed for currency */}
                                {msg.content.split('**').map((part, i) =>
                                    i % 2 === 1 ? <strong key={i} className={msg.role === 'system' ? 'text-[#00D4FF]' : 'text-white'}>{part}</strong> : part
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="bg-finance-800 border-t border-finance-700/50 p-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        disabled={loading}
                        className="flex-1 bg-finance-900 border border-finance-700 rounded-full px-6 py-3.5 text-finance-text focus:outline-none focus:border-[#4F46E5] transition-colors placeholder:text-finance-muted/50 disabled:opacity-50"
                        placeholder={loading ? 'Conectando con DB...' : 'Pregúntale a ChatIA sobre tus finanzas...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-r from-[#8C30F5] to-[#E600E6] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-[0_0_15px_rgba(230,0,230,0.3)]"
                    >
                        <Send size={20} className="-mr-1" />
                    </button>
                </div>
                <p className="text-center text-[10px] text-finance-muted mt-3">
                    ChatIA puede cometer errores. Considera verificar los datos importantes en tu Resumen Financiero.
                </p>
            </form>
        </div>
    );
}
