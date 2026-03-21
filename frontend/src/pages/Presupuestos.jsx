import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Target, Plus, Trash2, TrendingDown, AlertCircle, Info, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlobalLoader from '../components/ui/GlobalLoader';
import AnimatedCounter from '../components/ui/AnimatedCounter';

export default function Presupuestos() {
    const { t } = useLanguage();
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ category_id: '', amount_limit: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const categoryRef = useRef(null);


    useEffect(() => {
        fetchData();
    }, []);


    const fetchData = async () => {
        try {
            const [bRes, cRes, sRes] = await Promise.all([
                api.get('/budgets'),
                api.get('/categories'),
                api.get('/stats')
            ]);
            setBudgets(bRes.data.data);
            setCategories(cRes.data.data);
            setStats(sRes.data.data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/budgets', form);
            toast.success(t('budget_saved'));
            setForm({ category_id: '', amount_limit: '' });
            fetchData();
        } catch (error) {
            toast.error(t('save_error'));
        }
    };

    const handleDelete = async (budget) => {
        try {
            await api.delete(`/budgets/${budget.id}`);
            toast.success(t('budget_deleted'));
            setShowDeleteConfirm(null);
            fetchData();
        } catch (error) {
            toast.error(t('delete_error'));
        }
    };


    const handleEdit = (budget) => {
        setForm({
            category_id: budget.category_id,
            amount_limit: budget.amount_limit
        });
        categoryRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return <GlobalLoader fullScreen={true} />;

    const totalBudget = budgets.reduce((acc, b) => acc + Number(b.amount_limit), 0);
    const totalSpent = stats?.summary.totalSpentThisMonth || 0;
    const remains = Math.max(0, totalBudget - totalSpent);
    const progressPerc = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return (
        <div className="space-y-6 animate-fade-in">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t('budgets')}</h1>
                    <p className="text-finance-muted text-sm">{t('control_spending')}</p>
                </div>
            </div>

            {/* Overall Budget Progress */}
            <div className="card p-6 border-finance-primary/20 bg-white/5">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-xs font-bold text-finance-muted uppercase tracking-widest mb-1">{t('global_budget')}</p>
                        <div className="flex items-baseline gap-2">
                            <AnimatedCounter amount={totalSpent} className="text-3xl font-black text-finance-text" />
                            <span className="text-finance-muted font-normal text-lg">/</span>
                            <AnimatedCounter amount={totalBudget} className="text-lg text-finance-muted" />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-finance-muted mb-1 font-medium">{t('available')}</p>
                        <AnimatedCounter
                            amount={remains}
                            className={`text-xl font-bold ${remains > 0 ? 'text-[#00FFFF]' : 'text-[#FF4DA6]'}`}
                        />
                    </div>
                </div>
                <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                        className={`h-full transition-all duration-1000 ease-out ${progressPerc > 100 ? 'bg-[#FF4DA6]' : progressPerc > 80 ? 'bg-[#FFD166]' : 'bg-finance-primary'}`}
                        style={{ width: `${Math.min(100, progressPerc)}%` }}
                    />
                </div>
                {progressPerc > 90 && (
                    <div className="mt-4 flex items-center gap-2 text-[#FF4DA6] text-xs font-bold animate-pulse">
                        <AlertCircle size={14} /> {t('budget_alert')}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to add/update budget */}
                <div className="lg:col-span-1">
                    <div className="card p-5 space-y-5 sticky top-24 bg-white/5">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-finance-muted uppercase tracking-wider">
                            <Plus size={16} className="text-finance-primary" /> {t('define_limit')}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-finance-muted uppercase mb-1.5 ml-1">{t('category_label')}</label>
                                <select
                                    ref={categoryRef}
                                    required
                                    className="input-field"
                                    value={form.category_id}
                                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                                >
                                    <option value="">{t('select_placeholder')}</option>
                                    {categories
                                        .filter(c => (c.type || 'expense') === 'expense')
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-finance-muted uppercase mb-1.5 ml-1">{t('monthly_limit_label')}</label>
                                <input
                                    type="number"
                                    required
                                    className="input-field"
                                    placeholder="0.00"
                                    value={form.amount_limit}
                                    onChange={e => setForm({ ...form, amount_limit: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-primary w-full py-3 shadow-lg flex justify-center items-center gap-2">
                                <TrendingDown size={18} /> {form.category_id && budgets.some(b => b.category_id === form.category_id) ? (t('save_changes')?.toUpperCase() || 'GUARDAR CAMBIOS') : t('assign_limit')}
                            </button>
                        </form>
                        <div className="bg-finance-primary/5 p-4 rounded-xl border border-white/5 flex gap-3">
                            <Info size={20} className="text-finance-primary flex-shrink-0" />
                            <p className="text-[11px] text-finance-muted leading-relaxed">
                                {t('budget_help')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* List of active budgets */}
                <div className="lg:col-span-2 space-y-4">
                    {budgets.length === 0 ? (
                        <div className="card p-10 text-center border-dashed border-2 border-white/5 bg-transparent">
                            <Target size={40} className="mx-auto text-white/10 mb-4" />
                            <p className="text-finance-muted">{t('no_budgets_title')}</p>
                            <p className="text-xs text-finance-muted/60 mt-2 italic">{t('no_budgets_subtitle')}</p>
                        </div>
                    ) : (
                        budgets.map(b => {
                            const spentInCat = stats?.budgetAnalysis?.find(ba => ba.category === b.categories?.name)?.spent || 0;
                            const perc = (spentInCat / b.amount_limit) * 100;
                            return (
                                <div key={b.id} className="card p-5 group card-glow hover:-translate-y-1 active:scale-[0.98] cursor-pointer transition-all duration-300 bg-white/5 backdrop-blur-md border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: b.categories?.color }}>
                                                {b.categories?.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-finance-text">{b.categories?.name}</h4>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-finance-muted font-bold uppercase tracking-widest">{t('limit_prefix')}</span>
                                                    <AnimatedCounter amount={b.amount_limit} className="text-[10px] text-finance-muted font-bold" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(b)}
                                                className="p-2 text-finance-muted hover:text-finance-primary hover:bg-finance-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(b)}
                                                className="p-2 text-finance-muted hover:text-[#FF4DA6] hover:bg-[#FF4DA6]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <div className="flex items-center gap-1">
                                                <span className="text-finance-muted">{t('spent_prefix')}</span>
                                                <AnimatedCounter amount={spentInCat} className="text-finance-muted" />
                                            </div>
                                            <span className={perc > 100 ? 'text-[#FF4DA6]' : perc > 80 ? 'text-[#FFD166]' : 'text-finance-primary'}>
                                                {perc.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full transition-all duration-700 ${perc > 100 ? 'bg-[#FF4DA6]' : perc > 80 ? 'bg-[#FFD166]' : 'bg-finance-primary'}`}
                                                style={{ width: `${Math.min(100, perc)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
            {/* Modal de Confirmación de Eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    role="dialog" aria-modal="true">
                    <div className="card p-6 w-full max-w-sm border-[#FF4DA6]/20 animate-scale-in bg-[#11111d]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-[#FF4DA6]/15 rounded-xl">
                                <Trash2 size={20} className="text-[#FF4DA6]" />
                            </div>
                            <h2 className="text-lg font-bold">{t('delete_confirm')}</h2>
                        </div>
                        <p className="text-finance-muted text-sm mb-5">{t('delete_budget_confirm')}</p>
                        <div className="p-3 bg-black/40 border border-white/5 rounded-xl mb-6">
                            <p className="text-sm font-bold text-finance-text">{showDeleteConfirm.categories?.name}</p>
                            <p className="text-xs text-finance-muted mt-1 uppercase tracking-wider">{t('limit_prefix')}${Number(showDeleteConfirm.amount_limit).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 text-finance-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium text-sm">
                                {t('cancel')}
                            </button>
                            <button onClick={() => handleDelete(showDeleteConfirm)}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#FF4DA6] to-[#8C30F5] hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-pink-500/20">
                                {t('delete_label')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
