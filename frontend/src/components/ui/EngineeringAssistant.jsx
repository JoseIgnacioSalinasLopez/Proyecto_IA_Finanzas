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
    Trash2
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const PriorityBadge = ({ level }) => {
    const { t } = useLanguage();
    const styles = {
        critical: "bg-red-500/20 text-red-500 border-red-500/50",
        important: "bg-orange-500/20 text-orange-500 border-orange-500/50",
        optional: "bg-blue-500/20 text-blue-500 border-blue-500/50"
    };
    const labels = {
        critical: t('critical'),
        important: t('important'),
        optional: t('optional')
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
    const [eventFormData, setEventFormData] = useState({ title: '', amount: '', date: '', priority: 'important' });

    if (!stats) return null;

    const {
        summary = { totalIncome: 0, totalExpense: 0, balance: 0, dailyBurnRate: 0, bufferTime: 0, riskLevel: 'BAJO' },
        goals = [],
        monthlyExpensesByCategory = [],
        manualEvents = []
    } = stats;

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', {
                ...eventFormData,
                amount: Number(eventFormData.amount || 0)
            });
            setShowEventModal(false);
            setEventFormData({ title: '', amount: '', date: '', priority: 'important' });
            if (onRefresh) await onRefresh(); // Re-fetch stats to update timeline
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm(t('delete_event_confirm'))) {
            try {
                await api.delete(`/events/${id}`);
                if (onRefresh) await onRefresh(); // Re-fetch stats to update timeline
            } catch (error) {
                console.error(error);
            }
        }
    };

    // Smart Timeline Logic
    const generateTimeline = () => {
        const events = [];
        const now = new Date();
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        const fifteenDaysAhead = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

        // A. Metas (Goals)
        goals?.forEach(goal => {
            const deadline = new Date(goal.deadline);
            const target = Number(goal.target_amount || 0);
            const current = Number(goal.current_amount || 0);

            let status = "upcoming";
            if (deadline < now && deadline.toDateString() !== now.toDateString()) status = "expired";
            else if (deadline.toDateString() === now.toDateString()) status = "today";

            events.push({
                id: `goal-${goal.id}`,
                title: `${t('goal_prefix')}${goal.name}`,
                amount: Math.max(0, target - current),
                status,
                priority: status === "expired" ? "critical" : "important",
                time: status === "expired" ? t('expired_label') : (status === "today" ? t('today_label') : `${t('for_label')} ${deadline.toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX')}`),
                description: `${t('missing_amount')}$${Math.max(0, target - current).toFixed(2)}${t('to_complete')}`
            });
        });

        // B. Gastos Recurrentes Detectados
        stats.recurrentExpenses?.forEach((desc, idx) => {
            events.push({
                id: `recurrent-${idx}`,
                title: `${t('recurrent_expense_prefix')}${desc.toUpperCase()}`,
                amount: 0,
                status: "upcoming",
                priority: "optional",
                time: t('projected'),
                description: t('recurrent_suggestion')
            });
        });

        // C. Alertas Automáticas
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
                description: t('overspend_desc')
            });
        }

        if (Number(summary.bufferTime || 0) < 30) {
            events.push({
                id: 'alert-low-buffer',
                title: t('critical_buffer'),
                amount: 0,
                status: "today",
                priority: "critical",
                time: t('alert'),
                description: `${t('low_buffer_desc')} (${summary.bufferTime} ${t('remaining_days_label')}).`
            });
        }

        // D. Eventos Manuales
        manualEvents?.forEach(ev => {
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
                isManual: true
            });
        });

        // Sort events: critical/today first, then upcoming
        return events.sort((a, b) => {
            const priorityMap = { critical: 0, important: 1, optional: 2 };
            return priorityMap[a.priority] - priorityMap[b.priority];
        }).slice(0, 10);
    };

    const timelineData = generateTimeline();

    return (
        <div className="text-white overflow-hidden flex flex-col h-full font-sans">
            {/* Área de Encabezado — Simplificada porque el Dashboard ya tiene el título */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] bg-finance-primary/20 text-finance-primary px-2.5 py-1 rounded-lg uppercase font-bold tracking-widest border border-finance-primary/30">
                            {t('operational_status')}
                        </span>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-finance-muted uppercase font-mono tracking-tighter">{t('terminal_id')}</p>
                    <p className="text-xs font-mono text-finance-primary">8842-MB-PRIME</p>
                </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 flex-1">
                {/* Columna Izquierda: Estadísticas y Metas */}
                <div className="2xl:col-span-5 space-y-7 flex flex-col justify-start 2xl:border-r border-white/5 2xl:pr-6">

                    {/* Motor de Supervivencia */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <Zap size={14} className="text-finance-neon" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">{t('survival_engine')}</h3>
                        </div>
                        <div className="bg-finance-900/50 p-4 rounded-xl border border-finance-700">
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
                                <div>
                                    <p className="text-[10px] text-finance-muted text-right uppercase">{t('financial_health')}</p>
                                    <p className={`text-sm font-bold text-right uppercase ${summary?.riskLevel === 'CRÍTICO' ? 'text-red-500' : summary?.riskLevel === 'MEDIO' ? 'text-orange-500' : 'text-finance-primary'}`}>
                                        {summary?.riskLevel === 'BAJO' ? t('risk_low') :
                                            summary?.riskLevel === 'MEDIO' ? t('risk_medium') :
                                                summary?.riskLevel === 'CRÍTICO' ? t('risk_critical') :
                                                    summary?.riskLevel}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Asignación de Presupuesto */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-white">
                                <Target size={14} className="text-finance-primary" />
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-finance-muted">{t('set_asides_month')}</h3>
                            </div>
                            <button
                                onClick={() => navigate('/resumen')}
                                className="text-[11px] text-finance-primary hover:text-white transition-colors flex items-center gap-1 font-bold"
                            >
                                <Plus size={11} /> {t('view_movements')}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {stats.monthlyExpensesByCategory?.slice(0, 3).map((cat, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-[11px] mb-1.5 font-bold uppercase">
                                        <span className="text-finance-muted">{cat.name}</span>
                                        <span className="text-finance-text">${cat.amount.toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${idx === 0 ? 'bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.4)]' : idx === 1 ? 'bg-indigo-500' : 'bg-finance-muted'}`}
                                            style={{ width: `${Math.min((cat.amount / Math.max(summary.totalIncome, 1)) * 100 || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {!stats.monthlyExpensesByCategory?.length && (
                                <p className="text-xs text-finance-muted italic">{t('no_expenses_month')}</p>
                            )}
                        </div>
                    </section>

                    {/* Metas Estratégicas */}
                    <section className="mt-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-white">
                                <TrendingUp size={14} className="text-finance-neon" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">{t('strategic_goals')}</h3>
                            </div>
                            <button
                                onClick={() => navigate('/metas')}
                                className="text-[10px] text-finance-primary hover:text-white transition-colors flex items-center gap-1 font-bold"
                            >
                                <Plus size={10} /> {t('schedule')}
                            </button>
                        </div>
                        {goals?.length > 0 ? (
                            <div className="bg-finance-900/50 p-4 rounded-xl border border-finance-700 flex items-center gap-4">
                                <div className="w-10 h-10 bg-finance-primary/10 rounded flex items-center justify-center text-finance-primary">
                                    <Laptop size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold mb-1.5 truncate">{goals[0].name}</p>
                                    <div className="h-1.5 bg-white/5 rounded-full mb-1.5">
                                        <div className="h-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.4)]" style={{ width: `${(goals[0].current_amount / goals[0].target_amount) * 100}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-finance-muted font-mono">
                                        <span>${Number(goals[0].current_amount || 0).toLocaleString(language === 'en' ? 'en-US' : 'es-MX')} / ${Number(goals[0].target_amount || 0).toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</span>
                                        <span className="text-finance-primary font-bold">{((goals[0].current_amount / goals[0].target_amount) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-finance-muted italic">{t('no_active_goals')}</p>
                        )}
                    </section>
                </div>

                {/* Columna Derecha: Línea de Tiempo Inteligente */}
                <div className="2xl:col-span-7 space-y-5">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-white">
                            <Clock size={14} className="text-finance-neon" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">{t('smart_timeline')}</h3>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <button
                                onClick={() => setShowEventModal(true)}
                                className="bg-finance-primary/10 hover:bg-finance-primary/20 text-finance-primary text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-finance-primary/30 transition-all mr-2"
                            >
                                <Plus size={12} /> {t('add_event')}
                            </button>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div><span className="text-[11px] font-bold text-finance-muted uppercase">{t('critical')}</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div><span className="text-[11px] font-bold text-finance-muted uppercase">{t('alert')}</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.4)]"></div><span className="text-[11px] font-bold text-finance-muted uppercase">{t('optimize')}</span></div>
                        </div>
                    </div>

                    <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-finance-700/50">
                        {timelineData.length > 0 ? timelineData.map((item) => (
                            <div key={item.id} className={`relative`}>
                                {/* Nodo de Línea de Tiempo */}
                                <div className={`absolute -left-8 p-1 rounded-full border-2 bg-[#0B022D] z-10 
                  ${item.status === 'expired' ? 'border-red-500 text-red-500' :
                                        item.status === 'today' ? 'border-orange-500 text-orange-500 scale-110 shadow-[0_0_10px_rgba(249,115,22,0.3)]' :
                                            'border-finance-primary text-finance-primary'}`}>
                                    {item.status === 'expired' ? <AlertCircle size={14} /> : <Calendar size={14} />}
                                </div>

                                <div className={`p-3.5 rounded-xl border transition-all hover:bg-finance-900/30
                  ${item.status === 'today' ? 'bg-orange-950/20 border-orange-500/30' : 'bg-finance-900/20 border-white/5'}`}>
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="min-w-0 pr-2">
                                            <p className={`text-[10px] font-bold uppercase mb-0.5 tracking-tight ${item.status === 'expired' ? 'text-red-500' : item.status === 'today' ? 'text-orange-500' : 'text-finance-primary'}`}>
                                                {item.time} {item.status === 'expired' ? '⚠️' : ''}
                                            </p>
                                            <h4 className="text-[13px] font-bold truncate leading-tight">{item.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.isManual && (
                                                <button
                                                    onClick={() => handleDeleteEvent(item.id)}
                                                    className="text-finance-muted hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                            <PriorityBadge level={item.priority} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] text-finance-muted max-w-[70%]">
                                            {item.description}
                                        </p>
                                        <span className={`text-sm font-mono font-bold ${item.status === 'expired' ? 'text-red-500' : 'text-white'}`}>
                                            {item.amount > 0 ? `$${item.amount.toFixed(2)}` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-finance-muted italic">{t('no_events')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Información del Pie de Página */}
            <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-finance-muted font-mono tracking-widest">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400"></span> {t('system_ok')}</span>
                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400"></span> {t('db_connected')}</span>
                </div>
                <div className="hidden sm:block">© 2026 MENTEBILLETE CORE OPS</div>
            </div>

            {/* Modal de Eventos Manuales */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-[#130B42] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-finance-neon">{t('schedule_manual_event')}</h2>
                        <form onSubmit={handleEventSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-finance-muted mb-1">{t('event_title')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-finance-900 border border-finance-700 p-3 rounded-xl focus:outline-none focus:border-finance-neon text-white text-sm"
                                    placeholder={t('event_title_placeholder')}
                                    value={eventFormData.title}
                                    onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-finance-muted mb-1">{t('amount_optional')}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-finance-900 border border-finance-700 p-3 rounded-xl focus:outline-none focus:border-finance-neon text-white text-sm"
                                        value={eventFormData.amount}
                                        onChange={e => setEventFormData({ ...eventFormData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-finance-muted mb-1">{t('date_label')}</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-finance-900 border border-finance-700 p-3 rounded-xl focus:outline-none focus:border-finance-neon text-white text-sm"
                                        value={eventFormData.date}
                                        onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-finance-muted mb-1">{t('priority_label')}</label>
                                <select
                                    required
                                    className="w-full bg-finance-900 border border-finance-700 p-3 rounded-xl focus:outline-none focus:border-finance-neon text-white text-sm"
                                    value={eventFormData.priority}
                                    onChange={e => setEventFormData({ ...eventFormData, priority: e.target.value })}
                                >
                                    <option value="important">{t('priority_important')}</option>
                                    <option value="critical">{t('priority_critical')}</option>
                                    <option value="optional">{t('priority_optional')}</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEventModal(false)}
                                    className="px-4 py-2 text-finance-muted hover:text-white text-sm"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="bg-finance-neon text-black font-bold px-6 py-2 rounded-xl text-sm hover:brightness-110 transition-all"
                                >
                                    {t('add_to_timeline')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
