import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import SummaryCard from '../components/ui/SummaryCard';
import { ArrowDownRight, ArrowUpRight, Wallet, Plus, X, ChevronDown, ChevronUp, Target, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import EngineeringAssistant from '../components/ui/EngineeringAssistant';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Toast from '../components/ui/Toast';

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
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, transRes] = await Promise.all([
                api.get('/stats'),
                api.get('/transactions'),
            ]);
            setStats(statsRes.data.data);
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

            return () => { 
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id, fetchDashboardData]);

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

    const { summary } = stats || { summary: { totalIncome: 0, totalExpense: 0, balance: 0, totalBudget: 0, totalSpentThisMonth: 0 } };

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

            {/* Resumen de Presupuesto Mensual */}
            {summary.totalBudget > 0 && (
                <div className="card p-5 animate-fade-in-up border-white/5 bg-white/5" style={{ animationDelay: '180ms' }}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-finance-muted uppercase tracking-wider flex items-center gap-2">
                            <Target size={16} className="text-finance-primary" /> {t('budgets')} {t('of_the_month')}
                        </h3>
                        <span className="text-xs font-bold text-finance-text">
                            ${summary.totalSpentThisMonth.toLocaleString()} / ${summary.totalBudget.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className={`h-full transition-all duration-1000 ease-out ${
                                (summary.totalSpentThisMonth / summary.totalBudget) > 0.9 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-finance-primary'
                            }`}
                            style={{ width: `${Math.min(100, (summary.totalSpentThisMonth / summary.totalBudget) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Grid 50/50: Ingeniería Financiera + Movimientos Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Tarjeta de Ingeniería Financiera */}
                <div className="card p-0 overflow-hidden animate-fade-in-up h-full flex flex-col" style={{ animationDelay: '200ms' }}>
                    <div className="w-full p-4 md:p-5 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-finance-primary/10 rounded-xl border border-finance-primary/20 text-finance-primary">
                                <Calendar size={24} strokeWidth={2} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black text-white leading-none">
                                    {t('engineering_card')}
                                </h3>
                                <span className="text-[10px] font-black tracking-widest text-finance-primary/80 uppercase mt-1">
                                    {t('smart_tracking_system')}
                                </span>
                            </div>
                        </div>
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
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
                                    className="btn-primary text-sm flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={16} /> {t('register_first')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentTransactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-finance-primary/20 transition-all duration-200 group"
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
                onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
                className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-finance-primary text-black shadow-[0_0_25px_rgba(0,212,255,0.4)] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_35px_rgba(0,212,255,0.6)] active:scale-95 transition-all duration-200 z-40"
                title={t('quick_registration')}
                aria-label={t('quick_registration')}
            >
                <Plus size={26} strokeWidth={2.5} />
            </button>
        </div>
    );
}
