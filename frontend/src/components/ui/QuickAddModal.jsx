import { useState, useEffect, useRef } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Toast from './Toast';
import DatePickerElite from './DatePickerElite';

const EMPTY_FORM = {
    amount: '',
    type: 'expense',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
};

export default function QuickAddModal() {
    const { t } = useLanguage();
    const [show, setShow] = useState(false);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const firstInputRef = useRef(null);

    useEffect(() => {
        const handleOpen = () => {
            setShow(true);
            fetchCategories();
        };
        window.addEventListener('open-quick-add', handleOpen);
        return () => window.removeEventListener('open-quick-add', handleOpen);
    }, []);

    useEffect(() => {
        if (show) {
            setTimeout(() => firstInputRef.current?.focus(), 100);
        }
    }, [show]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
            if (res.data.data.length > 0 && !form.category_id) {
                setForm(prev => ({ ...prev, category_id: res.data.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching categories for quick add', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);
            const now = new Date();
            const [y, m, d] = form.date.split('-');
            const dateWithTime = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

            await api.post('/transactions', {
                ...form,
                amount: parseFloat(form.amount),
                date: dateWithTime.toISOString()
            });
            setToast({ message: t('movement_registered'), type: 'success' });
            setTimeout(() => {
                setShow(false);
                setForm(EMPTY_FORM);
            }, 1500);
        } catch (error) {
            setToast({ message: t('registration_error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 drop-shadow-2xl">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShow(false)} />

            <div className="relative w-full max-w-md bg-[#11111d] border border-white/10 rounded-2xl overflow-visible shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-finance-primary/20 rounded-lg text-finance-primary">
                            <Plus size={18} />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">{t('quick_registration')}</h2>
                    </div>
                    <button onClick={() => setShow(false)} className="text-finance-muted hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Tipo */}
                    <div>
                        <label className="block text-xs font-semibold text-finance-muted mb-2 uppercase tracking-wide">
                            {t('movement_type')}
                        </label>
                        <div className="flex gap-2">
                            {[
                                { key: 'expense', label: t('expense_label'), color: 'red' },
                                { key: 'income', label: t('income_label'), color: 'emerald' }
                            ].map((type) => (
                                <button
                                    key={type.key}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: type.key, category_id: '' })}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${form.type === type.key
                                        ? type.color === 'red'
                                            ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                                        : 'bg-black/20 border-white/10 text-finance-muted hover:border-white/30'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Monto */}
                    <div>
                        <label htmlFor="quick-amount" className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                            {t('amount_label')}
                        </label>
                        <input
                            id="quick-amount"
                            ref={firstInputRef}
                            type="number" step="0.01" min="0.01" required
                            placeholder="0.00"
                            className="input-field text-xl font-bold"
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="quick-description" className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                            {t('description_label')}
                        </label>
                        <input
                            id="quick-description"
                            type="text" required
                            placeholder={t('description_placeholder')}
                            className="input-field"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    {/* Fecha */}
                    <DatePickerElite
                        id="quick-date"
                        label={t('date_label')}
                        value={form.date}
                        onChange={val => setForm({ ...form, date: val })}
                    />

                    {/* Categoría */}
                    <div>
                        <label htmlFor="quick-category" className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                            {t('category_label')}
                        </label>
                        <select
                            id="quick-category"
                            required className="input-field"
                            value={form.category_id}
                            onChange={e => setForm({ ...form, category_id: e.target.value })}
                        >
                            <option value="" disabled>{t('select_category')}</option>
                            {categories
                                .filter(c => (c.type || 'expense') === form.type)
                                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>


                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShow(false)}
                            className="btn-ghost flex-1"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn-primary flex-1 flex justify-center items-center gap-2 ${form.type === 'expense' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-400 border-red-500/50' : ''
                                }`}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                `✓ ${t('save')}`
                            )}
                        </button>
                    </div>
                </form>

                {toast && (
                    <div className="absolute bottom-4 left-4 right-4 z-[110]">
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
