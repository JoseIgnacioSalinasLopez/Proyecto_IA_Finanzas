import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import SummaryCard from '../components/ui/SummaryCard';
import { ArrowDownRight, ArrowUpRight, Wallet, Plus, X, ChevronDown, ChevronUp, Target, Calendar, Eye, EyeOff, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import EngineeringAssistant from '../components/ui/EngineeringAssistant';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import GlobalLoader from '../components/ui/GlobalLoader';
import SpotlightCard from '../components/ui/SpotlightCard';

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

import { DashboardSkeleton, ListSkeleton } from '../components/ui/SkeletonLoader';

// Skeleton de carga para tarjetas

export default function Dashboard() {
    const { user } = useAuthContext();
    const { t, language } = useLanguage();
    const { showBalances, toggleBalances } = useTheme();
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, transRes] = await Promise.all([
                api.get('/stats'),
                api.get('/transactions'),
            ]);
            setStats(statsRes.data.data);
            const sortedTx = transRes.data.data.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateB - dateA !== 0) return dateB - dateA;
                // Fallback to created_at if dates are same (today)
                return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
            });
            setRecentTransactions(sortedTx.slice(0, 20)); // Aumentamos el límite para ver el historial
        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const groupTransactionsByDate = (transactions) => {
        const groups = {
            today: [],
            yesterday: []
        };

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);

        transactions.forEach(tx => {
            // Check created_at as priority since tx.date might just be a day string (YYYY-MM-DD)
            const d = tx.created_at ? new Date(tx.created_at) : new Date(tx.date);

            // Normalize transaction date to start of its day for comparison
            const txStartOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

            if (txStartOfDay === startOfToday) {
                if (groups.today.length < 5) groups.today.push(tx);
            } else if (txStartOfDay === startOfYesterday) {
                if (groups.yesterday.length < 5) groups.yesterday.push(tx);
            }
        });

        return groups;
    };

    useEffect(() => {
        fetchDashboardData();

        // ESCUCHAR RECARGAS GLOBALES
        window.addEventListener('refresh-data', fetchDashboardData);

        if (user?.id) {
            const channel = supabase
                .channel('dashboard-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, fetchDashboardData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` }, fetchDashboardData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_events', filter: `user_id=eq.${user.id}` }, fetchDashboardData)
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                window.removeEventListener('refresh-data', fetchDashboardData);
            };
        }
        return () => window.removeEventListener('refresh-data', fetchDashboardData);
    }, [user?.id, fetchDashboardData]);

    if (loading) {
        return <GlobalLoader fullScreen={true} />;
    }

    const { summary } = stats || { summary: { totalIncome: 0, totalExpense: 0, balance: 0, liquidBalance: 0, totalGoalSavings: 0, totalInvestments: 0, totalBudget: 0, totalSpentThisMonth: 0 } };
    const hasInvestments = summary.totalInvestments > 0;

    return (
        <div className="space-y-6 relative">

            {/* Encabezado con saludo personalizado */}
            <div className="animate-fade-in-up flex justify-between items-end">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-0.5 text-finance-text">
                        {getGreeting(t)}, <span className="text-finance-primary">{user?.name?.split(' ')[0] || t('guest')}</span> 👋
                    </h1>
                    <p className="text-finance-muted text-sm capitalize">{getFormattedDate(language)}</p>
                </div>

                <button
                    onClick={toggleBalances}
                    className="p-2 mb-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#00FFFF]/30 text-finance-muted hover:text-[#00FFFF] transition-all shadow-sm flex items-center gap-2 group"
                    title={showBalances ? t('hide_balances') : t('show_balances')}
                >
                    {showBalances ? <EyeOff size={20} className="group-hover:scale-110 transition-transform" /> : <Eye size={20} className="group-hover:scale-110 transition-transform" />}
                </button>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title={t('total_balance')} amount={summary.balance} icon={<Wallet size={22} />} type="balance" delay={0} description={t('total_balance_desc')} />
                <SummaryCard title={t('monthly_income')} amount={summary.totalIncome} icon={<ArrowUpRight size={22} />} type="income" delay={80} description={t('monthly_income_desc')} />
                <SummaryCard title={t('monthly_expenses')} amount={summary.totalExpense} icon={<ArrowDownRight size={22} />} type="expense" delay={160} description={t('monthly_expenses_desc')} />
                <SummaryCard title={t('liquid_balance')} amount={summary.liquidBalance} icon={<Zap size={22} className="text-[#00FFFF]" />} type="income" delay={240} description={t('liquid_balance_desc')} />
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
                    <div className="h-2.5 w-full bg-black/20 dark:bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full transition-all duration-1000 ease-out ${(summary.totalSpentThisMonth / summary.totalBudget) > 0.9 ? 'bg-[#FF4DA6] shadow-[0_0_10px_rgba(255,77,166,0.3)]' : 'bg-gradient-to-r from-[#00FFFF] to-[#2F5BFF]'
                                }`}
                            style={{ width: `${Math.min(100, (summary.totalSpentThisMonth / summary.totalBudget) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Grid 50/50: Ingeniería Financiera + Movimientos Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Tarjeta de Ingeniería Financiera */}
                <SpotlightCard className="h-full rounded-[2rem]" spotlightColor="rgba(0, 212, 255, 0.1)">
                    <div className="card p-0 overflow-hidden animate-fade-in-up h-full flex flex-col" style={{ animationDelay: '200ms' }}>
                        <div className="w-full p-4 md:p-5 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-finance-primary/10 rounded-xl border border-finance-primary/20 text-finance-primary">
                                    <Calendar size={24} strokeWidth={2} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-black text-finance-text leading-none">
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
                </SpotlightCard>

                {/* Movimientos Recientes (Elite Timeline Style) */}
                <div className="card animate-fade-in-up h-full flex flex-col border-black/5 soft-ui-border dark:border-white/5 bg-white soft-ui-bg dark:bg-white/5" style={{ animationDelay: '300ms' }}>
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 px-1">
                        <h2 className="text-sm font-black text-finance-muted uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-finance-primary rounded-full shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                            {t('recent_movements')}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[720px] pr-2 mb-2">
                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-finance-muted mb-4 text-sm italic">{t('no_movements')}</p>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
                                    className="btn-primary text-sm flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={16} /> {t('register_first')}
                                </button>
                            </div>
                        ) : (() => {
                            const groups = groupTransactionsByDate(recentTransactions);
                            return (
                                <div className="space-y-6 relative ml-2 mt-4 pb-4">
                                    {/* Línea vertical de tiempo Sólida para que se note */}
                                    <div className="absolute left-[11px] top-3 bottom-0 w-[2px] bg-gradient-to-b from-finance-primary/80 via-finance-primary/20 to-transparent shadow-[0_0_8px_rgba(0,212,255,0.2)]" />

                                    {Object.entries(groups).map(([key, txs]) => {
                                        if (txs.length === 0) return null;
                                        return (
                                            <div key={key} className="space-y-4">
                                                <div className="flex items-center gap-3 relative z-10">
                                                    <div className="w-[24px] h-[24px] rounded-full bg-finance-900 border border-finance-primary/50 flex items-center justify-center shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-finance-primary/80 bg-finance-primary/10 px-2 py-0.5 rounded-md border border-finance-primary/20">
                                                        {key === 'today' ? t('today_label') : t('yesterday_label')}
                                                    </span>
                                                </div>

                                                <div className="space-y-3 ml-[11px] pl-6">
                                                    {txs.map((tx) => (
                                                        <div
                                                            key={tx.id}
                                                            className="relative flex justify-between items-center p-3 sm:p-4 bg-white soft-ui-bg dark:bg-white/[0.03] rounded-2xl border border-black/5 soft-ui-border dark:border-white/5 hover:border-finance-primary/20 hover:bg-black/10 dark:hover:bg-white/[0.05] transition-all duration-300 group"
                                                        >
                                                            {/* Mini conector horizontal sólido */}
                                                            <div className="absolute -left-6 top-1/2 w-6 h-[1px] bg-finance-primary/40" />

                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'income' ? 'bg-[#00FFFF]/10 text-[#00FFFF] shadow-[inset_0_0_12px_rgba(0,255,255,0.05)]' : 'bg-[#FF4DA6]/10 text-[#FF4DA6] shadow-[inset_0_0_12px_rgba(255,77,166,0.05)]'}`}>
                                                                    {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-sm text-finance-text group-hover:text-finance-primary transition-colors truncate">
                                                                        {tx.description || tx.categories?.name || t('no_description')}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1.5 font-bold">
                                                                        {tx.categories?.name && (
                                                                            <span
                                                                                className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap border transition-all"
                                                                                style={{
                                                                                    backgroundColor: `${tx.categories?.color || '#818cf8'}15`,
                                                                                    color: tx.categories?.color || '#818cf8',
                                                                                    borderColor: `${tx.categories?.color || '#818cf8'}30`
                                                                                }}
                                                                            >
                                                                                {tx.categories.name}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[10px] text-finance-muted/80 font-medium">
                                                                            {new Date(tx.date).toLocaleTimeString(language === 'en' ? 'en-US' : 'es-MX', {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                                hour12: true
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <p className={`font-black text-sm tracking-tight ${tx.type === 'income' ? 'text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]' : 'text-[#FF4DA6] drop-shadow-[0_0_8px_rgba(255,77,166,0.3)]'}`}>
                                                                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>
                            );
                        })()}
                    </div>

                    {/* Footer Fijo con el Botón "Ver Todo" siempre visible */}
                    {recentTransactions.length > 0 && (
                        <div className="pt-4 mt-auto border-t border-white/5 text-center shrink-0">
                            <Link to="/resumen" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-finance-primary hover:text-finance-text transition-all bg-finance-primary/5 hover:bg-finance-primary/20 px-4 py-2 rounded-full border border-finance-primary/10">
                                {t('view_all')} <Plus size={12} />
                            </Link>
                        </div>
                    )}
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
