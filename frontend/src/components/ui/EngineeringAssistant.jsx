import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Zap,
    PieChart,
    Bell,
    AlertCircle,
    Trash2,
    Clock,
    CheckCircle2,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Check,
    RotateCcw,
    Plus,
    Target,
    X
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import DatePickerElite from './DatePickerElite';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';


const PriorityBadge = ({ level }) => {
    const { t } = useLanguage();
    const styles = {
        critical: "bg-[#FF4DA6]/20 text-[#FF4DA6] border-[#FF4DA6]/50",
        important: "bg-[#FFD166]/20 text-[#FFD166] border-[#FFD166]/50",
        optional: "bg-blue-500/20 text-blue-500 border-blue-500/50"
    };
    const labels = {
        critical: t('priority_critical'),
        important: t('priority_important'),
        optional: t('priority_optional')
    };

    return (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${styles[level]}`}>
            {labels[level]}
        </span>
    );
};

export default function EngineeringAssistant({ stats, onRefresh }) {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventFormData, setEventFormData] = useState({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        priority: 'important',
        is_recurring: false,
        payment_day: '',
        deadline_day: ''
    });
    const [editEventId, setEditEventId] = useState(null);
    const [prefs, setPrefs] = useState({ hide_challenges: false, hide_forecasts: false });
    const [simResult, setSimResult] = useState(null);

    // Fetch preferences
    React.useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await api.get('/preferences');
                if (res.data.success && res.data.data) {
                    setPrefs({
                        hide_challenges: res.data.data.hide_challenges ?? false,
                        hide_forecasts: res.data.data.hide_forecasts ?? false
                    });
                }
            } catch (err) {
                console.error('Error fetching timeline prefs:', err);
            }
        };
        fetchPrefs();
    }, []);

    // Carousel state
    const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

    // Custom Delete Confirmation state
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    if (!stats) return null;

    const {
        summary = { totalIncome: 0, totalExpense: 0, balance: 0, dailyBurnRate: 0, bufferTime: 0, riskLevel: 'BAJO' },
        goals = [],
        manualEvents = [],
        budgetAnalysis = []
    } = stats;

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...eventFormData,
                amount: Number(eventFormData.amount || 0),
                payment_day: eventFormData.is_recurring ? Number(eventFormData.payment_day) : null,
                deadline_day: eventFormData.is_recurring ? Number(eventFormData.deadline_day) : null
            };

            if (editEventId) {
                await api.put(`/events/${editEventId}`, payload);
            } else {
                await api.post('/events', payload);
            }

            setShowEventModal(false);
            setEditEventId(null);
            setEventFormData({
                title: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                priority: 'important',
                is_recurring: false,
                payment_day: '',
                deadline_day: ''
            });
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDelete = async (id) => {
        try {
            await api.delete(`/events/${id}`);
            setDeleteConfirmId(null);
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error(error);
        }
    };

    // Función para simular el impacto de cancelar un gasto en el Buffer Time
    const handleSimulate = (item) => {
        if (!stats || !stats.summary) return;
        const { balance, bufferTime, dailyBurnRate } = stats.summary;

        const currentMonthly = dailyBurnRate * 30;
        const newMonthly = Math.max(0, currentMonthly - item.amount);
        const newDaily = newMonthly / 30;

        const newBuffer = newDaily > 0 ? (balance / newDaily) : 999;
        const impact = newBuffer - bufferTime;

        setSimResult({
            title: item.title,
            amount: item.amount,
            oldBuffer: Math.round(bufferTime),
            newBuffer: Math.round(newBuffer),
            impact: Math.round(impact)
        });
    };

    const handleEdit = (id) => {
        const ev = manualEvents.find(e => e.id === id);
        if (ev) {
            setEditEventId(id);
            setEventFormData({
                title: ev.title || '',
                amount: ev.amount || '',
                date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                priority: ev.priority || 'important',
                is_recurring: ev.is_recurring || false,
                payment_day: ev.payment_day || '',
                deadline_day: ev.deadline_day || ''
            });
            setShowEventModal(true);
        }
    };

    // Smart Timeline Logic
    const generateTimeline = () => {
        const events = [];
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysRemaining = daysInMonth - currentDay;

        // 1. Hitos de Metas (Goal Milestones)
        goals?.forEach(goal => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            let milestone = 0;
            if (progress >= 75) milestone = 75;
            else if (progress >= 50) milestone = 50;
            else if (progress >= 25) milestone = 25;

            if (milestone > 0) {
                events.push({
                    id: `milestone-${goal.id}-${milestone}`,
                    title: t('goal_milestone_title'),
                    amount: goal.current_amount,
                    status: "today",
                    priority: "important",
                    time: `${milestone}%`,
                    description: t('goal_milestone_desc').replace('{percentage}', milestone).replace('{name}', goal.name),
                    icon: <Target size={14} className="text-finance-primary" />
                });
            }
        });

        // 2. Retos de Ahorro (Challenges) - NOW DAILY FOR TESTING
        if (!prefs.hide_challenges) {
            events.push({
                id: 'daily-challenge',
                title: t('savings_challenge_title'),
                amount: 0,
                status: "today",
                priority: "optional",
                time: t('today_label'),
                description: t('savings_challenge_desc'),
                icon: <Zap size={14} className="text-finance-neon" />
            });
        }

        // 3. Recordatorios de Suscripciones (Detect keywords)
        stats.recurrentExpenses?.forEach((desc, idx) => {
            events.push({
                id: `sub-${idx}`,
                title: t('sub_reminder_title'),
                amount: 0,
                status: "upcoming",
                priority: "important",
                time: t('projected'),
                description: t('sub_reminder_desc').replace('{name}', desc.toUpperCase()),
                icon: <Bell size={14} className="text-finance-primary" />
            });
        });

        // 4. Logros de Disciplina (Daily budget check)
        // Simulamos racha basada en si el gasto mensual / días transcurridos es menor al burn rate
        const dailyAvgSoFar = summary.totalExpense / (currentDay || 1);
        if (dailyAvgSoFar < summary.dailyBurnRate && summary.totalExpense > 0) {
            events.push({
                id: 'discipline-streak',
                title: t('discipline_streak_title'),
                amount: 0,
                status: "today",
                priority: "optional",
                time: t('today_label'),
                description: t('discipline_streak_desc').replace('{days}', currentDay),
                icon: <TrendingUp size={14} className="text-finance-neon" />
            });
        }

        // 5. Alertas de Inversión / Ahorro
        if (summary.balance > 5000 && summary.riskLevel === 'BAJO') {
            const investAmount = Math.floor(summary.balance * 0.2); // Sigue 20%
            events.push({
                id: 'invest-alert',
                title: t('invest_alert_title'),
                amount: investAmount,
                status: "upcoming",
                priority: "optional",
                time: t('alert'),
                description: t('invest_alert_desc').replace('${amount}', investAmount.toLocaleString()),
                icon: <PieChart size={14} className="text-finance-primary" />
            });
        }

        // 6. Pronóstico de Saldo
        if (!prefs.hide_forecasts) {
            const projectedEndBalance = summary.balance + (summary.totalIncome - summary.totalExpense);
            events.push({
                id: 'forecast-end',
                title: t('balance_forecast_title'),
                amount: projectedEndBalance,
                status: "upcoming",
                priority: "important",
                time: `${t('from_label')} ${daysRemaining} ${t('days')}`,
                description: t('balance_forecast_desc').replace('${amount}', projectedEndBalance.toLocaleString()),
                icon: <TrendingUp size={14} className="text-finance-neon" />
            });
        }

        // Alertas Automáticas de Balance (Original logic)
        const totalExp = Number(summary.totalExpense || 0);
        const totalInc = Number(summary.totalIncome || 0);

        if (totalExp > totalInc) {
            events.push({
                id: 'alert-overspend',
                title: t('monthly_deficit'),
                amount: totalExp - totalInc,
                status: "today",
                priority: "critical",
                time: t('alert'),
                description: t('overspend_desc'),
                icon: <AlertCircle size={14} className="text-[#FF4DA6]" />
            });
        }

        if (Number(summary.bufferTime || 0) < 30 && summary.totalExpense > 0) {
            events.push({
                id: 'alert-low-buffer',
                title: t('critical_buffer'),
                amount: 0,
                status: "today",
                priority: "critical",
                time: t('alert'),
                description: `${t('low_buffer_desc')} (${summary.bufferTime} ${t('remaining_days_label')}).`,
                icon: <AlertCircle size={14} className="text-[#FF4DA6]" />
            });
        }
        // Eventos Manuales y Recurrentes Personalizados
        manualEvents?.forEach(ev => {
            const lastPaidDate = ev.last_paid_at ? new Date(ev.last_paid_at) : null;
            const isPaidThisMonth = ev.status === 'paid' && lastPaidDate &&
                (lastPaidDate.getMonth() === currentMonth) &&
                (lastPaidDate.getFullYear() === currentYear);

            if (ev.is_recurring && ev.payment_day) {
                const pDay = Number(ev.payment_day);
                const dDay = Number(ev.deadline_day);
                let status = "upcoming";
                let priority = ev.priority || "important";
                let timeDesc = `${t('next_payment')}: ${pDay}/${currentMonth + 1}`;

                if (isPaidThisMonth) {
                    status = "paid";
                    timeDesc = t('paid_label');
                } else if (currentDay >= pDay && currentDay <= dDay) {
                    status = "today";
                    timeDesc = t('deadline_approaching');
                } else if (currentDay > dDay && !isPaidThisMonth) { // Only mark as expired if not paid this month
                    const daysOver = currentDay - dDay;
                    status = "expired";
                    timeDesc = `${t('not_paid_yet')} (+${daysOver} ${t('days')})`;
                }

                events.push({
                    id: ev.id,
                    title: ev.title,
                    amount: Number(ev.amount || 0),
                    status,
                    priority,
                    time: timeDesc,
                    description: `${t('payment_day')}: ${pDay} | ${t('deadline_day')}: ${dDay}`,
                    isManual: true,
                    isRecurring: true,
                    lastPaidAt: ev.last_paid_at,
                    transactionId: ev.transaction_id,
                    icon: status === 'paid' ? <CheckCircle2 size={14} className="text-[#00FFFF]" /> : <Bell size={14} className="text-finance-primary" />
                });
            } else {
                const evDate = new Date(ev.date);
                let status = "upcoming";
                if (ev.status === 'paid') status = "paid";
                else if (evDate.toDateString() === now.toDateString()) status = "today";
                else if (evDate < now && ev.status !== 'paid') status = "expired"; // Only mark as expired if not paid

                events.push({
                    id: ev.id,
                    title: ev.title,
                    amount: Number(ev.amount || 0),
                    status,
                    priority: ev.priority,
                    time: status === 'paid' ? t('paid_label') : (status === "expired" ? t('past_label') : (status === "today" ? t('today_label') : `${t('event_label')}${evDate.toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX')}`)),
                    description: t('manual_event_desc'),
                    isManual: true,
                    lastPaidAt: ev.last_paid_at,
                    transactionId: ev.transaction_id,
                    icon: status === 'paid' ? <CheckCircle2 size={14} className="text-[#00FFFF]" /> : <Calendar size={14} className="text-finance-primary" />
                });
            }
        });

        // Sort events: critical/today first, then upcoming, then paid
        return events.sort((a, b) => {
            const statusMap = { expired: 0, today: 1, upcoming: 2, paid: 3 };
            const priorityMap = { critical: 0, important: 1, optional: 2 };

            if (statusMap[a.status] !== statusMap[b.status]) {
                return statusMap[a.status] - statusMap[b.status];
            }
            return priorityMap[a.priority] - priorityMap[b.priority];
        }).slice(0, 15);
    };

    const timelineData = generateTimeline();
    const nextGoal = () => goals.length > 0 && setCurrentGoalIndex((currentGoalIndex + 1) % goals.length);
    const prevGoal = () => goals.length > 0 && setCurrentGoalIndex((currentGoalIndex - 1 + goals.length) % goals.length);

    return (
        <div className="text-finance-text overflow-hidden flex flex-col h-full font-sans">


            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8 flex-1 overflow-hidden">
                <div className="2xl:col-span-5 space-y-8 flex flex-col justify-start 2xl:border-r border-black/5 dark:border-white/5 2xl:pr-6 overflow-y-auto custom-scrollbar">
                    {/* Survival Engine */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-finance-text">
                            <Zap size={14} className="text-finance-neon" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">{t('survival_engine')}</h3>
                        </div>
                        <div className="bg-white soft-ui-bg dark:bg-white/5 backdrop-blur-md p-4 rounded-xl border border-black/5 soft-ui-border dark:border-white/5">
                            <p className="text-[10px] text-finance-muted mb-1">{t('safe_daily_rate')}</p>
                            <div className="flex items-baseline gap-1">
                                <AnimatedCounter
                                    amount={Number(summary?.dailyBurnRate || 0)}
                                    className="text-2xl font-mono font-bold text-finance-neon"
                                    decimals={2}
                                />
                                <span className="text-xs text-finance-neon/60">{t('per_day')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-[10px] text-finance-muted">{t('buffer_time_label')}</p>
                                    <p className="text-sm font-bold text-finance-neon">{summary?.bufferTime || 0} {t('days')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-finance-muted uppercase">{t('financial_health')}</p>
                                    <p className={`text-sm font-bold uppercase ${summary?.riskLevel === 'CRÍTICO' ? 'text-[#FF4DA6]' : summary?.riskLevel === 'MEDIO' ? 'text-[#FFD166]' : 'text-finance-primary'}`}>
                                        {summary?.riskLevel === 'BAJO' ? t('risk_low') :
                                            summary?.riskLevel === 'MEDIO' ? t('risk_medium') :
                                                summary?.riskLevel === 'CRÍTICO' ? t('risk_critical') :
                                                    summary?.riskLevel}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Apartados (Mes Actual) */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-finance-text">
                            <PieChart size={14} className="text-finance-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">{t('budget_allocation')}</h3>
                        </div>
                        <div className="bg-white soft-ui-bg dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-black/5 soft-ui-border dark:border-white/10 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {budgetAnalysis?.length > 0 ? budgetAnalysis.map((b, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-finance-text">{b.category || t('uncategorized')}</p>
                                        <div className="text-right">
                                            <div className="flex items-baseline justify-end gap-1">
                                                <AnimatedCounter amount={b.spent} className="text-sm font-mono font-black text-finance-text" />
                                                <span className="text-[10px] text-finance-muted font-normal">/</span>
                                                <AnimatedCounter amount={b.limit} className="text-[10px] text-finance-muted font-normal" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white soft-ui-bg dark:bg-black/40 rounded-full overflow-hidden border border-black/5 soft-ui-border dark:border-white/5">
                                        <div
                                            className={`h-full transition-all duration-1000 ${b.percentage > 90 ? 'bg-[#FF4DA6] dark:shadow-[0_0_10px_rgba(255,77,166,0.4)]' :
                                                b.percentage > 70 ? 'bg-[#FFD166] dark:shadow-[0_0_10px_rgba(255,209,102,0.4)]' :
                                                    'bg-finance-primary dark:shadow-[0_0_10px_rgba(0,212,255,0.4)]'
                                                }`}
                                            style={{ width: `${b.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-[10px] text-finance-muted italic text-center py-2">{t('no_budgets')}</p>
                            )}
                        </div>
                    </section>

                    {/* Strategic Goals */}
                    <section className="mt-auto pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-finance-text">
                                <TrendingUp size={14} className="text-finance-neon" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-finance-text">{t('strategic_goals')}</h3>
                            </div>
                            {goals.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <button onClick={prevGoal} className="p-1 hover:bg-white/10 rounded-full transition-colors text-finance-muted hover:text-finance-text">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-[10px] font-mono text-finance-muted">{currentGoalIndex + 1}/{goals.length}</span>
                                    <button onClick={nextGoal} className="p-1 hover:bg-white/10 rounded-full transition-colors text-finance-muted hover:text-finance-text">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {goals?.length > 0 ? (
                            <div className="bg-white soft-ui-bg dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-black/5 soft-ui-border dark:border-white/10 flex items-center gap-4 relative overflow-hidden group">
                                {/* Botones de acción - Visibles y posicionados arriba a la derecha */}
                                <div className="absolute top-3 right-3 flex items-center gap-3 z-10">
                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('open-progress-goal', { detail: goals[currentGoalIndex] }))}
                                        className="text-finance-muted hover:text-finance-primary transition-colors"
                                        title={t('update_progress')}
                                    >
                                        <TrendingUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('open-edit-goal', { detail: goals[currentGoalIndex] }))}
                                        className="text-finance-muted hover:text-finance-primary transition-colors"
                                        title={t('edit_goal')}
                                    >
                                        <Pencil size={15} />
                                    </button>
                                </div>

                                <div className="w-12 h-12 bg-gradient-to-br from-finance-primary/20 to-finance-neon/10 rounded-xl flex items-center justify-center text-finance-primary dark:shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                                    <Target size={24} />
                                </div>
                                <div className="flex-1 min-w-0 pr-12">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-sm font-bold truncate uppercase tracking-tight text-finance-text">{goals[currentGoalIndex].name}</p>
                                        <span className="text-finance-primary text-xs font-black ml-2 shrink-0">
                                            {((goals[currentGoalIndex].current_amount / goals[currentGoalIndex].target_amount) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white soft-ui-bg dark:bg-black/40 rounded-full mb-2 overflow-hidden border border-black/5 soft-ui-border dark:border-white/5">
                                        <div
                                            className="h-full bg-finance-primary dark:shadow-[0_0_10px_rgba(0,212,255,0.4)] transition-all duration-1000"
                                            style={{ width: `${Math.min((goals[currentGoalIndex].current_amount / goals[currentGoalIndex].target_amount) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-finance-muted font-mono font-bold">
                                        <AnimatedCounter amount={goals[currentGoalIndex].current_amount || 0} className="text-finance-text" />
                                        <span className="text-finance-muted">/</span>
                                        <AnimatedCounter amount={goals[currentGoalIndex].target_amount || 0} className="text-finance-text" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl text-center">
                                <p className="text-xs text-finance-muted italic">{t('no_active_goals')}</p>
                                <button onClick={() => navigate('/metas')} className="mt-3 text-[10px] text-finance-primary font-black uppercase tracking-widest hover:underline">{t('create_goal')}</button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Smart Timeline section remains similarly structured but with icon updates */}
                <div className="2xl:col-span-7 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-finance-text">
                            <Clock size={14} className="text-finance-neon" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">{t('smart_timeline')}</h3>
                        </div>
                        <button
                            onClick={() => {
                                setEditEventId(null);
                                setEventFormData({
                                    title: '', amount: '', date: new Date().toISOString().split('T')[0],
                                    priority: 'important', is_recurring: false, payment_day: '', deadline_day: ''
                                });
                                setShowEventModal(true);
                            }}
                            className="bg-finance-primary/10 hover:bg-finance-primary/20 text-finance-primary text-[11px] font-black px-4 py-2 rounded-xl flex items-center gap-2 border border-finance-primary/20 transition-all uppercase tracking-widest"
                        >
                            <Plus size={14} /> {t('add_event')}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[580px]">
                        {timelineData.length > 0 ? timelineData.map((item) => (
                            <div key={item.id} className="relative group/item px-1 flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white soft-ui-bg dark:bg-black/40 z-10 transition-all duration-500
                                        ${item.status === 'expired' ? 'border-[#FF4DA6] text-[#FF4DA6] shadow-[0_0_10px_rgba(255,77,166,0.3)]' :
                                            item.status === 'today' ? 'border-[#FFD166] text-[#FFD166] shadow-[0_0_10px_rgba(255,209,102,0.3)]' :
                                                item.status === 'paid' ? 'border-[#00FFFF] text-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.3)]' :
                                                    'border-finance-primary text-finance-primary shadow-[0_0_10px_rgba(0,212,255,0.2)]'}`}>
                                        {item.icon || (item.status === 'expired' ? <AlertCircle size={14} /> : (item.status === 'paid' ? <Check size={14} /> : <Calendar size={14} />))}
                                    </div>
                                    <div className="w-[1px] flex-1 bg-white/10 my-1" />
                                </div>

                                <div className={`flex-1 p-3 sm:p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden
                                    ${item.status === 'expired' ? 'bg-[#FF4DA6]/5 border-[#FF4DA6]/20' :
                                        item.status === 'today' ? 'bg-[#FFD166]/10 border-[#FFD166]/30' :
                                            item.status === 'paid' ? 'bg-[#00FFFF]/10 border-[#00FFFF]/30 shadow-[inset_0_0_20px_rgba(0,255,255,0.05)]' :
                                                'bg-white soft-ui-bg border-black/5 soft-ui-border dark:bg-white/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'}`}>

                                    {deleteConfirmId === item.id ? (
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-finance-900 z-20 flex items-center justify-between px-3 sm:px-6 animate-fade-in">
                                            <span className="text-[10px] sm:text-xs font-bold text-[#FF4DA6]">{t('delete_event_confirm')}</span>
                                            <div className="flex gap-2 sm:gap-3">
                                                <button onClick={() => setDeleteConfirmId(null)} className="text-[9px] sm:text-[10px] uppercase font-black text-finance-muted hover:text-white">{t('keep_action')}</button>
                                                <button onClick={() => confirmDelete(item.id)} className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#FF4DA6]/20 text-[#FF4DA6] rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider hover:bg-[#FF4DA6] hover:text-white transition-all">{t('delete_action')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                                <div className="min-w-0 pr-2">
                                                    <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tighter mb-0.5
                                                        ${item.status === 'expired' ? 'text-[#FF4DA6]' :
                                                            item.status === 'today' ? 'text-[#FFD166]' :
                                                                item.status === 'paid' ? 'text-[#00FFFF]' : 'text-finance-primary'}`}>
                                                        {item.time}
                                                    </p>
                                                    <h4 className={`text-xs sm:text-sm font-bold truncate leading-tight uppercase tracking-tight text-finance-text ${item.status === 'paid' ? 'opacity-70 line-through' : ''}`}>{item.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {item.isManual && (
                                                        <div className="flex items-center gap-1">
                                                            {item.status === 'paid' && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (item.transactionId) {
                                                                            try {
                                                                                await api.delete(`/transactions/${item.transactionId}`);
                                                                            } catch (err) {
                                                                                console.error('Error deleting associated transaction:', err);
                                                                            }
                                                                        }

                                                                        await api.put(`/events/${item.id}`, {
                                                                            status: 'pending',
                                                                            last_paid_at: null,
                                                                            transaction_id: null
                                                                        });
                                                                        if (onRefresh) await onRefresh();
                                                                    }}
                                                                    className="bg-finance-muted/20 text-finance-muted hover:bg-finance-primary hover:text-white p-1.5 rounded-lg transition-all"
                                                                    title={t('undo_payment')}
                                                                >
                                                                    <RotateCcw size={12} strokeWidth={3} />
                                                                </button>
                                                            )}
                                                            {item.status !== 'paid' && (
                                                                <button
                                                                    onClick={() => {
                                                                        window.dispatchEvent(new CustomEvent('open-quick-add', {
                                                                            detail: {
                                                                                description: item.title,
                                                                                amount: item.amount,
                                                                                type: 'expense',
                                                                                onSuccess: async (txData) => {
                                                                                    await api.put(`/events/${item.id}`, {
                                                                                        status: 'paid',
                                                                                        last_paid_at: new Date().toISOString(),
                                                                                        transaction_id: txData?.id
                                                                                    });
                                                                                    if (onRefresh) await onRefresh();
                                                                                }
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="bg-[#00FFFF]/20 text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black p-1.5 rounded-lg transition-all"
                                                                    title={t('mark_as_paid')}
                                                                >
                                                                    <Check size={12} strokeWidth={3} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSimulate(item); }}
                                                                className="text-[#00FFFF] hover:bg-[#00FFFF]/20 p-1.5 rounded-lg transition-all"
                                                                title={t('simulate_impact')}
                                                            >
                                                                <Zap size={12} className={item.amount > 100 ? "animate-pulse" : ""} />
                                                            </button>
                                                            <button onClick={() => handleEdit(item.id)} className="text-finance-muted hover:text-finance-primary p-1 opacity-50 hover:opacity-100" title={t('edit_label')}>
                                                                <Pencil size={12} />
                                                            </button>
                                                            <button onClick={() => setDeleteConfirmId(item.id)} className="text-finance-muted hover:text-[#FF4DA6] p-1 opacity-50 hover:opacity-100" title={t('delete_action')}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <PriorityBadge level={item.priority} />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end gap-2">
                                                <p className="text-[9px] sm:text-[11px] text-finance-muted max-w-[65%] leading-relaxed font-medium line-clamp-2">
                                                    {item.description}
                                                </p>
                                                <span className={`text-sm sm:text-base font-mono font-black shrink-0 ${item.status === 'expired' ? 'text-[#FF4DA6]' : 'text-finance-text'}`}>
                                                    {item.amount > 0 ? <AnimatedCounter amount={item.amount} className={item.status === 'expired' ? 'text-[#FF4DA6]' : 'text-finance-text'} /> : ''}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <Clock size={40} className="mx-auto text-finance-muted/20 mb-3" />
                                <p className="text-xs text-finance-muted italic font-medium">{t('no_events')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showEventModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-white/40 dark:bg-black/80 backdrop-blur-xl flex justify-center items-center z-50 p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2, type: 'spring', bounce: 0.2 }}
                            className="card max-w-lg w-full p-8 relative overflow-visible bg-white soft-ui-bg dark:bg-finance-800 border-black/5 soft-ui-border dark:border-white/10"
                        >
                            <div className="absolute -top-10 -right-10 p-20 bg-finance-primary/5 rounded-full blur-3xl" />

                            <h2 className="text-2xl font-black mb-8 text-finance-text uppercase tracking-tighter flex items-center gap-3">
                                {editEventId ? <Pencil size={24} className="text-finance-primary" /> : <Plus size={24} className="text-finance-primary" />}
                                {editEventId ? t('edit_event') : t('schedule_manual_event')}
                            </h2>

                            <form onSubmit={handleEventSubmit} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black text-finance-muted uppercase tracking-widest mb-2">{t('event_title')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field soft-ui-input dark:!bg-white/5 focus:!bg-white dark:focus:!bg-white/10"
                                        placeholder={t('event_title_placeholder')}
                                        value={eventFormData.title}
                                        onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-200/30 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                    <div className={`p-2 rounded-lg transition-colors ${eventFormData.is_recurring ? 'bg-finance-primary/20 text-finance-primary' : 'bg-white/5 text-finance-muted'}`}>
                                        <Bell size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold">{t('recurring_event')}</h4>
                                        <p className="text-[10px] text-finance-muted uppercase font-bold">{t('monthly_reminder')}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEventFormData({ ...eventFormData, is_recurring: !eventFormData.is_recurring })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${eventFormData.is_recurring ? 'bg-finance-primary' : 'bg-slate-300 dark:bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${eventFormData.is_recurring ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-finance-muted uppercase tracking-widest mb-2">{t('amount_label')}</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="$0.00"
                                            value={eventFormData.amount}
                                            onChange={e => setEventFormData({ ...eventFormData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-finance-muted uppercase tracking-widest mb-2">{t('date_label')}</label>
                                        <DatePickerElite
                                            value={eventFormData.date}
                                            onChange={(val) => setEventFormData({ ...eventFormData, date: val })}
                                        />
                                    </div>
                                </div>


                                {eventFormData.is_recurring && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="grid grid-cols-2 gap-4 overflow-hidden"
                                    >
                                        <div>
                                            <label className="block text-[10px] font-black text-finance-muted uppercase tracking-widest mb-2">{t('payment_day')}</label>
                                            <input
                                                type="number"
                                                min="1" max="31"
                                                required
                                                className="input-field border-black/5 dark:border-white/5 bg-slate-200/50 dark:bg-white/5 focus:bg-slate-200 dark:focus:bg-white/10"
                                                placeholder={t('example_day').replace('{n}', 8)}
                                                value={eventFormData.payment_day}
                                                onChange={e => setEventFormData({ ...eventFormData, payment_day: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-finance-muted uppercase tracking-widest mb-2">{t('deadline_day')}</label>
                                            <input
                                                type="number"
                                                min="1" max="31"
                                                required
                                                className="input-field border-black/5 dark:border-white/5 bg-slate-200/50 dark:bg-white/5 focus:bg-slate-200 dark:focus:bg-white/10"
                                                placeholder={t('example_day').replace('{n}', 15)}
                                                value={eventFormData.deadline_day}
                                                onChange={e => setEventFormData({ ...eventFormData, deadline_day: e.target.value })}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-finance-muted uppercase tracking-widest mb-2">{t('priority_label')}</label>
                                    <div className="flex gap-2">
                                        {['optional', 'important', 'critical'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setEventFormData({ ...eventFormData, priority: p })}
                                                className={`flex-1 py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
                                                    ${eventFormData.priority === p ?
                                                        (p === 'critical' ? 'bg-[#FF4DA6] border-[#FF4DA6] text-white dark:shadow-[0_0_15px_rgba(255,77,166,0.4)]' : p === 'important' ? 'bg-[#FFD166] border-[#FFD166] text-white dark:shadow-[0_0_15px_rgba(255,209,102,0.4)]' : 'bg-finance-primary border-finance-primary text-black dark:shadow-[0_0_15px_rgba(0,212,255,0.4)]') :
                                                        'bg-slate-200/50 dark:bg-white/5 border-black/5 dark:border-white/10 text-finance-muted hover:border-black/20 dark:hover:border-white/20'}`}
                                            >
                                                {t(`priority_${p}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEventModal(false);
                                            setEditEventId(null);
                                        }}
                                        className="px-6 py-4 text-xs font-black text-finance-muted hover:text-white uppercase tracking-widest"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-epic !px-10 flex items-center gap-3 shadow-[0_0_30px_rgba(0,212,255,0.2)]"
                                    >
                                        <Check size={20} />
                                        <span>{editEventId ? t('save_changes').toUpperCase() : t('add_to_timeline').toUpperCase()}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Panel de Resultados de Simulación Flotante */}
            <AnimatePresence>
                {simResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed bottom-6 right-6 z-[100] w-80 overflow-hidden"
                    >
                        <div className="card p-5 border-finance-primary/40 bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-finance-primary/20 text-finance-primary">
                                        <Zap size={18} />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-tighter text-white">
                                        {t('simulation_mode')}
                                    </h4>
                                </div>
                                <button onClick={() => setSimResult(null)} className="text-finance-muted hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <p className="text-[11px] text-finance-muted mb-4 leading-relaxed">
                                {t('if_you_cancel').replace('{name}', <span className="text-white font-bold">{simResult.title}</span>).replace('{amount}', simResult.amount)}
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                    <p className="text-[10px] text-finance-muted uppercase mb-1">{t('current_buffer')}</p>
                                    <p className="text-lg font-mono font-black text-white">{simResult.oldBuffer}{t('days').substring(0, 1)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-finance-primary/10 border border-finance-primary/20 text-center">
                                    <p className="text-[10px] text-finance-primary uppercase mb-1">{t('new_buffer')}</p>
                                    <p className="text-lg font-mono font-black text-finance-primary glow-cyan">{simResult.newBuffer}{t('days').substring(0, 1)}</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={14} className="text-[#00FFFF]" />
                                    <span className="text-xs font-bold text-white">{t('positive_impact')}</span>
                                </div>
                                <span className="text-sm font-mono font-black text-[#00FFFF]">
                                    +{simResult.impact} {t('days')}
                                </span>
                            </div>

                            <button
                                onClick={() => setSimResult(null)}
                                className="w-full mt-4 py-2.5 rounded-xl bg-finance-primary/20 hover:bg-finance-primary/30 text-finance-primary text-[11px] font-black uppercase tracking-widest transition-all border border-finance-primary/30"
                            >
                                {t('understood')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
