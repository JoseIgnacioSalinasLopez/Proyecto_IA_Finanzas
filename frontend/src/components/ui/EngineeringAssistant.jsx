import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Calendar,
    TrendingUp,
    Laptop,
    Zap,
    Target,
    Plus,
    Trash2,
    Pencil,
    ChevronLeft,
    ChevronRight,
    Bell,
    Check,
    PieChart
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import DatePickerElite from './DatePickerElite';
import { motion, AnimatePresence } from 'framer-motion';


const PriorityBadge = ({ level }) => {
    const { t } = useLanguage();
    const styles = {
        critical: "bg-red-500/20 text-red-500 border-red-500/50",
        important: "bg-orange-500/20 text-orange-500 border-orange-500/50",
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
                icon: <AlertCircle size={14} className="text-red-500" />
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
                icon: <AlertCircle size={14} className="text-red-500" />
            });
        }

        // Eventos Manuales y Recurrentes Personalizados
        manualEvents?.forEach(ev => {
            if (ev.is_recurring && ev.payment_day) {
                const pDay = Number(ev.payment_day);
                const dDay = Number(ev.deadline_day);
                let status = "upcoming";
                let priority = ev.priority || "important";
                let timeDesc = `${t('next_payment')}: ${pDay}/${currentMonth + 1}`;

                if (currentDay >= pDay && currentDay <= dDay) {
                    status = "today";
                    timeDesc = t('deadline_approaching');
                } else if (currentDay > dDay) {
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
                    icon: <Bell size={14} className="text-finance-primary" />
                });
            } else {
                const evDate = new Date(ev.date);
                let status = "upcoming";
                if (evDate.toDateString() === now.toDateString()) status = "today";
                else if (evDate < now) status = "expired";

                events.push({
                    id: ev.id,
                    title: ev.title,
                    amount: Number(ev.amount || 0),
                    status,
                    priority: ev.priority,
                    time: status === "expired" ? t('past_label') : (status === "today" ? t('today_label') : `${t('event_label')}${evDate.toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX')}`),
                    description: t('manual_event_desc'),
                    isManual: true,
                    icon: <Calendar size={14} className="text-finance-primary" />
                });
            }
        });

        // Sort events: critical/today first, then upcoming
        return events.sort((a, b) => {
            const statusMap = { expired: 0, today: 1, upcoming: 2 };
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
                <div className="2xl:col-span-5 space-y-8 flex flex-col justify-start 2xl:border-r border-white/5 2xl:pr-6 overflow-y-auto custom-scrollbar">
                    {/* Survival Engine */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-finance-text">
                            <Zap size={14} className="text-finance-neon" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">{t('survival_engine')}</h3>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] text-finance-muted mb-1">{t('safe_daily_rate')}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-mono font-bold text-finance-neon">
                                    ${Number(summary?.dailyBurnRate || 0).toFixed(2)}
                                </span>
                                <span className="text-xs text-finance-neon/60">{t('per_day')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-[10px] text-finance-muted">{t('buffer_time_label')}</p>
                                    <p className="text-sm font-bold text-finance-neon">{summary?.bufferTime || 0} {t('days')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-finance-muted uppercase">{t('financial_health')}</p>
                                    <p className={`text-sm font-bold uppercase ${summary?.riskLevel === 'CRÍTICO' ? 'text-red-500' : summary?.riskLevel === 'MEDIO' ? 'text-orange-500' : 'text-finance-primary'}`}>
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
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {budgetAnalysis?.length > 0 ? budgetAnalysis.map((b, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-finance-text">{b.category || t('uncategorized')}</p>
                                        <div className="text-right">
                                            <p className="text-sm font-mono font-black text-finance-text">${b.spent.toLocaleString()} <span className="text-[10px] text-finance-muted font-normal">/ ${b.limit.toLocaleString()}</span></p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full transition-all duration-1000 ${b.percentage > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                                                b.percentage > 70 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' :
                                                    'bg-finance-primary shadow-[0_0_10px_rgba(0,212,255,0.4)]'
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
                            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4 relative overflow-hidden group">
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

                                <div className="w-12 h-12 bg-gradient-to-br from-finance-primary/20 to-finance-neon/10 rounded-xl flex items-center justify-center text-finance-primary shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                                    <Target size={24} />
                                </div>
                                <div className="flex-1 min-w-0 pr-12">
                                    <p className="text-sm font-bold mb-2 truncate uppercase tracking-tight text-finance-text">{goals[currentGoalIndex].name}</p>
                                    <div className="h-2 bg-black/20 dark:bg-black/40 rounded-full mb-2 overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-finance-primary shadow-[0_0_10px_rgba(0,212,255,0.4)] transition-all duration-1000"
                                            style={{ width: `${Math.min((goals[currentGoalIndex].current_amount / goals[currentGoalIndex].target_amount) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-finance-muted font-mono font-bold">
                                        <span className="text-finance-text">${Number(goals[currentGoalIndex].current_amount || 0).toLocaleString()} / ${Number(goals[currentGoalIndex].target_amount || 0).toLocaleString()}</span>
                                        <span className="text-finance-primary">
                                            {((goals[currentGoalIndex].current_amount / goals[currentGoalIndex].target_amount) * 100).toFixed(0)}%
                                        </span>
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
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-black/40 z-10 transition-all duration-500
                                        ${item.status === 'expired' ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                                            item.status === 'today' ? 'border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' :
                                                'border-finance-primary text-finance-primary shadow-[0_0_10px_rgba(0,212,255,0.2)]'}`}>
                                        {item.icon || (item.status === 'expired' ? <AlertCircle size={14} /> : <Calendar size={14} />)}
                                    </div>
                                    <div className="w-[1px] flex-1 bg-white/10 my-1" />
                                </div>

                                <div className={`flex-1 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden
                                    ${item.status === 'expired' ? 'bg-red-500/5 border-red-500/20' :
                                        item.status === 'today' ? 'bg-orange-500/10 border-orange-500/30' :
                                            'bg-white/5 border-white/5 hover:border-white/10'}`}>

                                    {deleteConfirmId === item.id ? (
                                        <div className="absolute inset-0 bg-finance-900 z-20 flex items-center justify-between px-6 animate-fade-in">
                                            <span className="text-xs font-bold text-red-400">{t('delete_event_confirm')}</span>
                                            <div className="flex gap-3">
                                                <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] uppercase font-black text-finance-muted hover:text-white">{t('keep_action')}</button>
                                                <button onClick={() => confirmDelete(item.id)} className="px-4 py-1.5 bg-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all">{t('delete_action')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0">
                                                    <p className={`text-[10px] font-black uppercase tracking-tighter mb-0.5
                                                        ${item.status === 'expired' ? 'text-red-500' :
                                                            item.status === 'today' ? 'text-orange-500' : 'text-finance-primary'}`}>
                                                        {item.time}
                                                    </p>
                                                    <h4 className="text-sm font-bold truncate leading-tight uppercase tracking-tight text-finance-text">{item.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-100 transition-opacity">
                                                    {item.isManual && (
                                                        <>
                                                            <button onClick={() => handleEdit(item.id)} className="text-finance-muted hover:text-finance-primary p-1 opacity-50 hover:opacity-100" title={t('edit_label')}>
                                                                <Pencil size={13} />
                                                            </button>
                                                            <button onClick={() => setDeleteConfirmId(item.id)} className="text-finance-muted hover:text-red-500 p-1 opacity-50 hover:opacity-100" title={t('delete_action')}>
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <PriorityBadge level={item.priority} />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-[11px] text-finance-muted max-w-[70%] leading-relaxed font-medium">
                                                    {item.description}
                                                </p>
                                                <span className={`text-base font-mono font-black ${item.status === 'expired' ? 'text-red-500' : 'text-finance-text'}`}>
                                                    {item.amount > 0 ? `$${item.amount.toLocaleString()}` : ''}
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl flex justify-center items-center z-50 p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2, type: 'spring', bounce: 0.2 }}
                            className="card max-w-lg w-full p-8 relative overflow-visible bg-finance-800 border-white/10"
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
                                        className="input-field !bg-white/5 focus:!bg-white/10"
                                        placeholder={t('event_title_placeholder')}
                                        value={eventFormData.title}
                                        onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
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
                                        className={`w-12 h-6 rounded-full transition-all relative ${eventFormData.is_recurring ? 'bg-finance-primary' : 'bg-white/10'}`}
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
                                                className="input-field border-white/5 bg-white/5 focus:bg-white/10"
                                                placeholder="Ej: 8"
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
                                                className="input-field border-white/5 bg-white/5 focus:bg-white/10"
                                                placeholder="Ej: 15"
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
                                                        (p === 'critical' ? 'bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : p === 'important' ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-finance-primary border-finance-primary text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]') :
                                                        'bg-white/5 border-white/10 text-finance-muted hover:border-white/20'}`}
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
        </div>
    );
}
