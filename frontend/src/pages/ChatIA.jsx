import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, User, Sparkles } from 'lucide-react';
import api from '../services/api';
import iaLogo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

const GET_SUGGESTIONS = (t) => [
    t('suggestion_1'),
    t('suggestion_2'),
    t('suggestion_3'),
    t('suggestion_4'),
    t('suggestion_5'),
    t('suggestion_6'),
];

function TypingBubble() {
    return (
        <div className="flex justify-start">
            <div className="flex max-w-[70%] gap-4 flex-row">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-finance-800 border border-[#00D4FF]/30 flex items-center justify-center overflow-hidden p-0.5">
                    <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="p-4 rounded-2xl rounded-bl-sm bg-finance-800 border border-finance-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-finance-primary rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-2 h-2 bg-finance-primary rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-2 h-2 bg-finance-primary rounded-full animate-bounce [animation-delay:300ms]"></span>
                </div>
            </div>
        </div>
    );
}

export default function ChatIA() {
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: t('ai_welcome')
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasGemini, setHasGemini] = useState(true); // assume true, fallback on error
    const messagesEndRef = useRef(null);
    const suggestions = GET_SUGGESTIONS(t);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const sendMessage = async (text) => {
        const userText = text.trim();
        if (!userText) return;

        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setInput('');
        setIsTyping(true);

        try {
            if (hasGemini) {
                const res = await api.post('/chat', { message: userText });
                setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
            } else {
                // Fallback local NLP
                const reply = localFallback(userText);
                setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            // If Gemini fails (no API key, quota, etc.), switch to local fallback
            if (error.response?.status === 500) {
                setHasGemini(false);
                const reply = localFallback(userText);
                setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: t('ai_error') }]);
            }
        } finally {
            setIsTyping(false);
        }
    };

    const localFallback = (text) => {
        const txt = text.toLowerCase();
        const isEn = language === 'en';
        if (txt.includes('gasto') || txt.includes('gastar') || txt.includes('spend') || txt.includes('expense'))
            return t('fallback_expense');
        if (txt.includes('ingreso') || txt.includes('ganancia') || txt.includes('income') || txt.includes('profit'))
            return t('fallback_income');
        if (txt.includes('balance') || txt.includes('dinero') || txt.includes('money'))
            return t('fallback_balance');
        return t('fallback_error');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const renderContent = (content) =>
        content.split('**').map((part, i) =>
            i % 2 === 1
                ? <strong key={i} className="text-[#00D4FF]">{part}</strong>
                : part
        );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] -m-4 md:-m-6 relative rounded-t-3xl overflow-hidden shadow-2xl z-10">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/5 flex items-center gap-4 px-6 py-4 flex-shrink-0 z-10 shadow-lg">
                <Link to="/" className="text-finance-muted hover:text-finance-text transition-colors p-2 hover:bg-white/5 rounded-full">
                    ←
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)] overflow-hidden p-[2px]">
                        <img src={iaLogo} alt={t('ai_assistant')} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-finance-text leading-tight">{t('ai_assistant')}</h2>
                            {hasGemini && (
                                <span className="flex items-center gap-1 text-[10px] bg-[#4F46E5]/20 text-[#8C8FFF] px-2 py-0.5 rounded-full font-bold border border-[#4F46E5]/30">
                                    <Sparkles size={9} /> Gemini
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <p className="text-xs text-emerald-400">{t('connected_data')}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00D4FF transparent' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] md:max-w-[70%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {msg.role === 'assistant' ? (
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-finance-800 border border-[#00D4FF]/30 flex items-center justify-center mt-auto overflow-hidden p-0.5">
                                    <img src={iaLogo} alt="IA" className="w-full h-full object-cover rounded-full" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-finance-700 flex items-center justify-center mt-auto">
                                    <User size={16} className="text-finance-text" />
                                </div>
                            )}
                            <div className={`p-4 rounded-2xl text-sm shadow-md backdrop-blur-md ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-[#8C30F5] to-[#4F46E5] text-white rounded-br-sm shadow-[0_0_15px_rgba(140,48,245,0.2)]'
                                : 'bg-white/10 border border-white/5 text-finance-text rounded-bl-sm'
                                }`}>
                                {renderContent(msg.content)}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && <TypingBubble />}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestion chips — only show on first message */}
            {messages.length === 1 && !isTyping && (
                <div className="px-6 pb-3 flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(s)}
                            className="text-xs px-3 py-1.5 rounded-full bg-finance-800 border border-finance-700 text-finance-muted hover:text-finance-text hover:border-[#4F46E5] transition-all"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl border-t border-white/5 p-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        disabled={isTyping}
                        className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-6 py-3.5 text-finance-text focus:outline-none focus:border-[#00D4FF]/50 transition-colors placeholder:text-finance-muted/50 disabled:opacity-50"
                        placeholder={isTyping ? t('typing') : t('ask_question')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-r from-[#8C30F5] to-[#E600E6] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-[0_0_15px_rgba(230,0,230,0.3)]"
                    >
                        <Send size={20} className="-mr-0.5" />
                    </button>
                </div>
                <p className="text-center text-[10px] text-finance-muted mt-3">
                    {t('ai_disclaimer')}
                </p>
            </form>
        </div>
    );
}
