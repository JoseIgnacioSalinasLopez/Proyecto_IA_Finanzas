import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import SummaryCard from '../components/ui/SummaryCard';
import { ArrowDownRight, ArrowUpRight, Wallet, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import EngineeringAssistant from '../components/ui/EngineeringAssistant';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Toast from '../components/ui/Toast';

const EMPTY_FORM = { amount: '', type: 'expense', category_id: '', description: '', date: new Date().toISOString().split('T')[0] };

function getGreeting(t) {
    const hour = new Date().getHours();
    if (hour < 12) return t('morning');
    if (hour < 18) return t('afternoon');
    return t('evening');
}

function getFormattedDate(language) {
    const locale = language === 'en' ? 'en-US' : 'es-MX';
    return new Date().toLocaleDateString(locale, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
}

// Skeleton de carga para tarjetas
function CardSkeleton() {
    return (
        <div className="card animate-pulse flex items-center gap-4 p-5">
            <div className="w-14 h-14 rounded-2xl skeleton-shimmer skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded skeleton skeleton-shimmer" />
                <div className="h-7 w-32 rounded skeleton skeleton-shimmer" />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuthContext();
    const { t, language } = useLanguage();
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFAB, setShowFAB] = useState(false);
    const [fabForm, setFabForm] = useState(EMPTY_FORM);
    const [fabLoading, setFabLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [assistantCollapsed, setAssistantCollapsed] = useState(false);
    const modalRef = useRef(null);
    const firstInputRef = useRef(null);

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, transRes, catRes] = await Promise.all([
                api.get('/stats'),
                api.get('/transactions'),
                api.get('/categories'),
            ]);
            setStats(statsRes.data.data);
            setCategories(catRes.data.data);
            const sortedTx = transRes.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecentTransactions(sortedTx.slice(0, 6));
        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
        if (user?.id) {
            const channel = supabase
                .channel('dashboard-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, fetchDashboardData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` }, fetchDashboardData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_events', filter: `user_id=eq.${user.id}` }, fetchDashboardData)
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [user?.id, fetchDashboardData]);

    // Focus trap en modal
    useEffect(() => {
        if (showFAB) {
            setTimeout(() => firstInputRef.current?.focus(), 50);
        }
    }, [showFAB]);

    // Cerrar modal con Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showFAB) {
                setShowFAB(false);
                setFabForm(EMPTY_FORM);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showFAB]);

    const handleFABSubmit = async (e) => {
        e.preventDefault();
        if (Number(fabForm.amount) <= 0) {
            showToast(t('amount_greater_than_zero'), 'error');
            return;
        }
        setFabLoading(true);
        try {
            await api.post('/transactions', { ...fabForm, amount: Number(fabForm.amount) });
            showToast(t('movement_registered'));
            setShowFAB(false);
            setFabForm(EMPTY_FORM);
            await fetchDashboardData();
        } catch (error) {
            showToast(t('registration_error'), 'error');
        } finally {
            setFabLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                    <div className="h-7 w-48 rounded skeleton skeleton-shimmer" />
                    <div className="h-4 w-64 rounded skeleton skeleton-shimmer" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <CardSkeleton /><CardSkeleton /><CardSkeleton />
                </div>
                <div className="h-64 rounded-2xl skeleton skeleton-shimmer" />
                <div className="h-48 rounded-2xl skeleton skeleton-shimmer" />
            </div>
        );
    }

    const { summary } = stats || { summary: { totalIncome: 0, totalExpense: 0, balance: 0 } };

    return (
        <div className="space-y-6 relative">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Encabezado con saludo personalizado */}
            <div className="animate-fade-in-up">
                <h1 className="text-2xl md:text-3xl font-bold mb-0.5">
                    {getGreeting(t)}, <span className="text-finance-primary">{user?.name?.split(' ')[0] || t('guest')}</span> 👋
                </h1>
                <p className="text-finance-muted text-sm capitalize">{getFormattedDate(language)}</p>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard title={t('total_balance')} amount={summary.balance} icon={<Wallet size={22} />} type="balance" delay={0} />
                <SummaryCard title={t('monthly_income')} amount={summary.totalIncome} icon={<ArrowUpRight size={22} />} type="income" delay={80} />
                <SummaryCard title={t('monthly_expenses')} amount={summary.totalExpense} icon={<ArrowDownRight size={22} />} type="expense" delay={160} />
            </div>

            {/* Grid 50/50: Ingeniería Financiera + Movimientos Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Tarjeta de Ingeniería Financiera */}
                <div className="card p-0 overflow-hidden animate-fade-in-up h-full flex flex-col" style={{ animationDelay: '200ms' }}>
                    <div className="w-full flex items-center justify-between p-4 md:p-5 border-b border-white/5">
                        <span className="flex items-center gap-2 text-xs font-bold text-finance-muted uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-finance-primary animate-pulse" />
                            {t('engineering_card')}
                        </span>
                    </div>
                    <div className="p-4 md:p-5 flex-1 overflow-auto">
                        <EngineeringAssistant stats={stats} onRefresh={fetchDashboardData} />
                    </div>
                </div>

                {/* Movimientos Recientes */}
                <div className="card animate-fade-in-up h-full flex flex-col" style={{ animationDelay: '300ms' }}>
                    <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
                        <h2 className="text-sm font-bold text-finance-muted uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {t('recent_movements')}
                        </h2>
                        <Link to="/resumen" className="text-xs text-finance-primary hover:text-finance-primaryHover transition-colors font-medium">
                            {t('view_all')} →
                        </Link>
                    </div>

                    <div className="flex-1">
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-finance-muted mb-4 text-sm">{t('no_movements')}</p>
                                <button
                                    onClick={() => setShowFAB(true)}
                                    className="btn-primary text-sm flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={16} /> {t('register_first')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentTransactions.map((tx, idx) => (
                                    <div
                                        key={tx.id}
                                        className="flex justify-between items-center p-3.5 bg-finance-900/40 rounded-xl border border-white/5 hover:border-finance-primary/20 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2.5 rounded-lg flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                                                {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-finance-text truncate">{tx.description || tx.categories?.name || t('no_description')}</p>
                                                <p className="text-[11px] text-finance-muted mt-0.5">
                                                    {tx.categories?.name && <span className="bg-white/5 px-2 py-0.5 rounded-md mr-2">{tx.categories.name}</span>}
                                                    {new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FAB — Botón flotante */}
            <button
                onClick={() => setShowFAB(true)}
                className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-finance-primary text-black shadow-[0_0_25px_rgba(0,212,255,0.4)] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_35px_rgba(0,212,255,0.6)] active:scale-95 transition-all duration-200 z-40"
                title={t('quick_registration')}
                aria-label={t('quick_registration')}
            >
                <Plus size={26} strokeWidth={2.5} />
            </button>

            {/* Modal de Registro Rápido */}
            {showFAB && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) { setShowFAB(false); setFabForm(EMPTY_FORM); } }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="fab-modal-title"
                >
                    <div
                        ref={modalRef}
                        className="bg-finance-800 p-6 rounded-2xl w-full max-w-sm border border-finance-700 shadow-2xl animate-scale-in"
                    >
                        <div className="flex justify-between items-center mb-5">
                            <h2 id="fab-modal-title" className="text-lg font-bold flex items-center gap-2">
                                ⚡ {t('quick_registration')}
                            </h2>
                            <button
                                onClick={() => { setShowFAB(false); setFabForm(EMPTY_FORM); }}
                                className="text-finance-muted hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all"
                                aria-label={t('cancel')}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFABSubmit} className="space-y-4" noValidate>
                            {/* Tipo */}
                            <div>
                                <label className="block text-xs font-semibold text-finance-muted mb-2 uppercase tracking-wide">
                                    {t('movement_type')}
                                </label>
                                <div className="flex gap-2" role="group" aria-label={t('movement_type')}>
                                    {[['expense', t('expense_label')], ['income', t('income_label')]].map(([tKey, label]) => (
                                        <button key={tKey} type="button"
                                            onClick={() => setFabForm({ ...fabForm, type: tKey })}
                                            aria-pressed={fabForm.type === tKey}
                                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${fabForm.type === tKey
                                                ? tKey === 'expense'
                                                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                                                : 'bg-finance-900 border-finance-700 text-finance-muted hover:border-white/30'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Monto */}
                            <div>
                                <label htmlFor="fab-amount" className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                                    {t('amount_label')}
                                </label>
                                <input
                                    id="fab-amount"
                                    ref={firstInputRef}
                                    type="number" step="0.01" min="0.01" required
                                    placeholder="0.00"
                                    className="input-field text-xl font-bold"
                                    value={fabForm.amount}
                                    onChange={e => setFabForm({ ...fabForm, amount: e.target.value })}
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label htmlFor="fab-description" className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                                    {t('description_label')}
                                </label>
                                <input
                                    id="fab-description"
                                    type="text" required
                                    placeholder={t('description_placeholder')}
                                    className="input-field"
                                    value={fabForm.description}
                                    onChange={e => setFabForm({ ...fabForm, description: e.target.value })}
                                />
                            </div>

                            {/* Categoría */}
                            <div>
                                <label htmlFor="fab-category" className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                                    {t('category_label')}
                                </label>
                                <select
                                    id="fab-category"
                                    required className="input-field"
                                    value={fabForm.category_id}
                                    onChange={e => setFabForm({ ...fabForm, category_id: e.target.value })}
                                >
                                    <option value="" disabled>{t('select_category')}</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Fecha */}
                            <div>
                                <label htmlFor="fab-date" className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                                    {t('date_label')}
                                </label>
                                <input
                                    id="fab-date"
                                    type="date" required className="input-field"
                                    value={fabForm.date}
                                    onChange={e => setFabForm({ ...fabForm, date: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowFAB(false); setFabForm(EMPTY_FORM); }}
                                    className="btn-ghost flex-1"
                                >
                                    {t('cancel')}
                                </button>
                                <button type="submit" disabled={fabLoading}
                                    className={`btn-primary flex-1 flex justify-center items-center gap-2 ${fabForm.type === 'expense'
                                        ? 'bg-red-500 shadow-red-500/20 hover:bg-red-400'
                                        : ''
                                        }`}
                                >
                                    {fabLoading
                                        ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{t('saving')}</>
                                        : `✓ ${t('save')}`
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
