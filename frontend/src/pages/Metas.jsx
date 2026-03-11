import { useState, useEffect } from 'react';
import { Plus, Trash2, Target, Calendar, TrendingUp, Pencil, X, Lightbulb } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import DatePickerElite from '../components/ui/DatePickerElite';


function calcMonthlySavingsNeeded(goal) {
    const target = Number(goal.target_amount) || 0;
    const current = Number(goal.current_amount) || 0;
    const remaining = Math.max(target - current, 0);
    const deadline = new Date(goal.deadline);
    const now = new Date();

    const monthsDiff = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    if (monthsDiff <= 0 || remaining <= 0) return null;
    return (remaining / monthsDiff).toFixed(2);
}

export default function Metas() {
    const { t, language } = useLanguage();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [progressModal, setProgressModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({ name: '', target_amount: '', current_amount: '', deadline: '' });
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });
    const closeToast = () => setToast(null);

    useEffect(() => {
        fetchGoals();
        window.addEventListener('refresh-data', fetchGoals);
        return () => window.removeEventListener('refresh-data', fetchGoals);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') {
                setShowModal(false); setProgressModal(null); setDeleteConfirm(null);
                setEditingGoal(null);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const fetchGoals = async () => {
        try {
            const { data } = await api.get('/goals');
            setGoals(data.data);
        } catch (error) {
            console.error(t('error_loading_goals'), error);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingGoal(null);
        setFormData({ name: '', target_amount: '', current_amount: '', deadline: '' });
        setShowModal(true);
    };

    const openEdit = (goal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount,
            current_amount: goal.current_amount || '',
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                target_amount: Number(formData.target_amount),
                current_amount: Number(formData.current_amount || 0),
            };
            if (editingGoal) {
                await api.put(`/goals/${editingGoal.id}`, payload);
                showToast(t('goal_updated'));
            } else {
                await api.post('/goals', payload);
                showToast(t('goal_created'));
            }
            setShowModal(false);
            setEditingGoal(null);
            setFormData({ name: '', target_amount: '', current_amount: '', deadline: '' });
            fetchGoals();
        } catch (error) {
            showToast(t('goal_save_error'), 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/goals/${id}`);
            showToast(t('goal_deleted'));
            setDeleteConfirm(null);
            fetchGoals();
        } catch (error) {
            showToast(t('goal_delete_error'), 'error');
        }
    };

    const handleUpdateProgress = async () => {
        if (!progressModal) return;
        const newAmount = Number(progressModal.value);
        if (isNaN(newAmount) || newAmount < 0) {
            showToast(t('invalid_amount'), 'error');
            return;
        }
        try {
            await api.put(`/goals/${progressModal.goal.id}`, { current_amount: newAmount });
            showToast(t('progress_updated'));
            setProgressModal(null);
            fetchGoals();
        } catch (error) {
            showToast(t('progress_error'), 'error');
        }
    };

    if (loading) return (
        <div className="p-6 min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-finance-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;
    const activeGoals = goals.length - completedGoals;

    return (
        <div className="space-y-6 animate-fade-in">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-finance-text">{t('goals')}</h1>
                    <p className="text-finance-muted mt-1 text-sm">
                        {activeGoals} {activeGoals === 1 ? t('active_label') : t('actives_label')}
                        {completedGoals > 0 && ` · ${completedGoals} ${completedGoals === 1 ? t('completed_label_sm') : t('completed_labels_sm')} ✅`}
                    </p>
                </div>
                <button onClick={openCreate}
                    className="bg-finance-primary hover:opacity-90 active:scale-95 text-black font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-finance-primary/20">
                    <Plus size={18} /> {t('add_goal')}
                </button>
            </div>

            {/* Grid de Metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {goals.map((goal, idx) => {
                    const target = Number(goal.target_amount) || 1;
                    const current = Number(goal.current_amount) || 0;
                    const progress = Math.min((current / target) * 100, 100);
                    const isComplete = progress >= 100;
                    const deadline = new Date(goal.deadline);
                    const isExpired = deadline < new Date() && !isComplete;
                    const monthlySavings = calcMonthlySavingsNeeded(goal);

                    return (
                        <div key={goal.id}
                            className={`card p-5 flex flex-col transition-all hover:-translate-y-0.5 animate-fade-in-up bg-white/5 ${isComplete
                                ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.1)]'
                                : isExpired
                                    ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
                                    : 'border-white/5 hover:border-finance-primary/20 hover:shadow-[0_0_20px_rgba(0,212,255,0.05)]'
                                }`}
                            style={{ animationDelay: `${idx * 60}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl border ${isComplete
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                                    : 'bg-finance-primary/15 text-finance-primary border-finance-primary/20 shadow-[0_0_15px_rgba(0,212,255,0.2)]'}`}>
                                    {isComplete ? <TrendingUp size={20} /> : <Target size={20} />}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setProgressModal({ goal, value: current })}
                                        className="text-finance-muted hover:text-finance-primary hover:bg-finance-primary/10 p-1.5 rounded-lg transition-all">
                                        <TrendingUp size={15} />
                                    </button>
                                    <button onClick={() => openEdit(goal)}
                                        className="text-finance-muted hover:text-finance-primary hover:bg-finance-primary/10 p-1.5 rounded-lg transition-all">
                                        <Pencil size={15} />
                                    </button>
                                    <button onClick={() => setDeleteConfirm(goal)}
                                        className="text-finance-muted hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-1 leading-tight text-finance-text">{goal.name}</h3>
                            <p className={`text-xs mb-3 flex items-center gap-1 ${isExpired ? 'text-red-400' : 'text-finance-muted'}`}>
                                <Calendar size={11} />
                                {isExpired ? (t('expired_label_sm') + ': ') : `${t('deadline_label')}: `}
                                {deadline.toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX')}
                            </p>

                            {isComplete && (
                                <div className="mb-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold text-center">
                                    ✅ {t('goal_completed_title')}
                                </div>
                            )}

                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-finance-muted">{t('progress')}</span>
                                    <span className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-finance-primary'}`}>
                                        {progress.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-2.5 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : isExpired ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.4)]'}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-3 border-t border-white/5 mt-auto">
                                <div>
                                    <p className="text-[10px] text-finance-muted uppercase tracking-wider mb-0.5">{t('target_amount')}</p>
                                    <p className="text-sm font-bold">${target.toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-finance-muted uppercase tracking-wider mb-0.5">{t('current_amount')}</p>
                                    <p className="text-sm font-bold text-finance-primary">${current.toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</p>
                                </div>
                            </div>

                            {!isComplete && !isExpired && monthlySavings && (
                                <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-finance-primary/5 border border-white/5 rounded-xl">
                                    <Lightbulb size={13} className="text-finance-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-finance-muted">
                                        {t('monthly_suggested')}: <span className="text-finance-primary font-bold">${monthlySavings}/{language === 'en' ? 'mo' : 'mes'}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-finance-700/30 rounded-3xl">
                        <Target size={48} className="text-finance-700 mb-4 opacity-20" />
                        <p className="text-finance-muted text-lg mb-1 font-medium">{t('no_goals_yet')}</p>
                        <button onClick={openCreate} className="btn-primary mt-4">
                            {t('create_first_goal')}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="card p-6 w-full max-w-md border-white/10 animate-scale-in bg-finance-800 overflow-visible">
                        <h2 className="text-xl font-bold mb-5 text-finance-text">{editingGoal ? t('edit_goal') : t('add_goal')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-finance-muted mb-1.5">{t('goal_name_label')} *</label>
                                <input type="text" required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-finance-muted mb-1.5">{t('target_amount')} *</label>
                                    <input type="number" required className="input-field" value={formData.target_amount} onChange={e => setFormData({ ...formData, target_amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-finance-muted mb-1.5">{t('current_amount')}</label>
                                    <input type="number" className="input-field" value={formData.current_amount} onChange={e => setFormData({ ...formData, current_amount: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-finance-muted mb-1.5">{t('deadline')} *</label>
                                <DatePickerElite
                                    value={formData.deadline}
                                    onChange={(val) => setFormData({ ...formData, deadline: val })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">{t('cancel')}</button>
                                <button type="submit" className="btn-primary">{t('save')}</button>
                            </div>
                        </form>
                    </div>

                </div>
            )}

            {/* Modal Progreso */}
            {progressModal && (
                <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setProgressModal(null)}>
                    <div className="card p-6 w-full max-w-sm border-white/10 animate-scale-in">
                        <h2 className="text-lg font-bold mb-4 text-finance-text">{t('update_progress')}</h2>
                        <p className="text-sm text-finance-muted mb-4">{progressModal.goal.name}</p>
                        <input type="number" className="input-field text-xl font-bold mb-5" value={progressModal.value} onChange={e => setProgressModal({ ...progressModal, value: e.target.value })} autoFocus />
                        <div className="flex gap-3">
                            <button onClick={() => setProgressModal(null)} className="flex-1 btn-ghost">{t('cancel')}</button>
                            <button onClick={handleUpdateProgress} className="flex-1 btn-primary">{t('update_button')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Eliminar */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
                    <div className="card p-6 w-full max-w-sm border-red-500/20 animate-scale-in">
                        <h2 className="text-lg font-bold mb-4 text-finance-text">{t('delete_confirm')}</h2>
                        <p className="text-sm text-finance-muted mb-5">"{deleteConfirm.name}"</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-ghost">{t('cancel')}</button>
                            <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 btn-danger">{t('delete_label')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
