import { useState, useEffect, useRef } from 'react';
import { X, Calendar, ArrowRight, ArrowLeft, Search, Plus } from 'lucide-react';
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
    const [onSuccessCallback, setOnSuccessCallback] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const firstInputRef = useRef(null);

    useEffect(() => {
        const handleOpen = (e) => {
            if (e.detail) {
                setForm({
                    ...EMPTY_FORM,
                    description: e.detail.description || '',
                    amount: e.detail.amount || '',
                    type: e.detail.type || 'expense',
                    date: e.detail.date || new Date().toISOString().split('T')[0]
                });
                if (e.detail.onSuccess) {
                    setOnSuccessCallback(() => e.detail.onSuccess);
                } else {
                    setOnSuccessCallback(null);
                }
            } else {
                setForm(EMPTY_FORM);
                setOnSuccessCallback(null);
            }
            setShow(true);
            setSearchTerm('');
            fetchCategories(e.detail?.type || 'expense');
        };
        window.addEventListener('open-quick-add', handleOpen);
        return () => window.removeEventListener('open-quick-add', handleOpen);
    }, []);

    useEffect(() => {
        if (show) {
            setTimeout(() => firstInputRef.current?.focus(), 100);
        }
    }, [show]);

    const fetchCategories = async (typeToUse) => {
        try {
            const res = await api.get('/categories');
            const catData = res.data?.data || [];
            setCategories(catData);
            
            // BUSCAR LA PRIMERA CATEGORÍA QUE COINCIDA CON EL TIPO ACTUAL (expense/income)
            const targetType = typeToUse || form.type;
            if (catData.length > 0 && !form.category_id) {
                const firstOfType = catData.find(c => (c.type || 'expense') === targetType);
                if (firstOfType) {
                    setForm(prev => ({ ...prev, category_id: firstOfType.id }));
                } else {
                    setForm(prev => ({ ...prev, category_id: catData[0].id }));
                }
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

            if (!form.category_id) {
                setToast({ message: t('select_category'), type: 'error' });
                setLoading(false);
                return;
            }

            const now = new Date();
            const [y, m, d] = form.date.split('-');
            const dateWithTime = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

            const res = await api.post('/transactions', {
                ...form,
                amount: parseFloat(form.amount),
                date: dateWithTime.toISOString()
            });

            // DISPARAR EVENTO GLOBAL DE RECARGA
            window.dispatchEvent(new CustomEvent('refresh-data'));

            // EJECUTAR CALLBACK DE ÉXITO SI EXISTE
            if (onSuccessCallback) {
                await onSuccessCallback(res.data.data);
            }

            setToast({ message: t('movement_registered'), type: 'success' });
            setTimeout(() => {
                setShow(false);
                setForm(EMPTY_FORM);
                setOnSuccessCallback(null);
            }, 1000);
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

            <div className="relative w-full max-w-md bg-finance-800 border border-white/10 rounded-2xl overflow-visible shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-finance-primary/20 rounded-lg text-finance-primary">
                            <Plus size={18} />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight text-finance-text">{t('quick_registration')}</h2>
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
                                                ? 'bg-[#FF4DA6]/20 border-[#FF4DA6] text-[#FF4DA6] shadow-[0_0_10px_rgba(255,77,166,0.2)]'
                                                : 'bg-[#00FFFF]/20 border-[#00FFFF] text-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                                        : 'bg-black/10 dark:bg-black/20 border-white/10 text-finance-muted hover:border-white/30'
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
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-finance-muted uppercase tracking-wide">
                            {t('category_label')}
                        </label>
                        
                        {/* Buscador de Categoría */}
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder={t('search_category')}
                                className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-finance-text focus:outline-none focus:border-finance-primary/50 transition-all placeholder:text-finance-muted/40"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-finance-muted/40" />
                        </div>

                        {/* Grid de Categorías */}
                        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                            {(categories || [])
                                .filter(c => c && (c.type || 'expense') === form.type)
                                .filter(c => c && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setForm({ ...form, category_id: c.id })}
                                        className={`flex items-center gap-2.5 p-2 rounded-xl text-[11px] font-bold border transition-all truncate
                                            ${form.category_id === c.id 
                                                ? 'bg-finance-primary/10 border-finance-primary/50 text-finance-primary shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                                                : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-finance-muted hover:border-finance-primary/30 hover:bg-finance-primary/5'}`}
                                    >
                                        <div 
                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                                            style={{ backgroundColor: c.color || '#00D4FF' }} 
                                        />
                                        <span className="truncate">{c.name}</span>
                                    </button>
                                ))
                            }
                            {(categories || [])
                                .filter(c => c && (c.type || 'expense') === form.type && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .length === 0 && (
                                <p className="col-span-2 py-4 text-center text-[10px] text-finance-muted uppercase tracking-widest opacity-50">
                                    {t('no_categories_found')}
                                </p>
                            )}
                        </div>
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
                            className={`btn-primary flex-1 flex justify-center items-center gap-2 ${form.type === 'expense' ? 'bg-gradient-to-r from-[#FF4DA6] to-[#8C30F5] shadow-[#FF4DA6]/20 hover:from-[#FF4DA6] hover:to-[#FF4DA6] border-[#FF4DA6]/50' : ''
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
