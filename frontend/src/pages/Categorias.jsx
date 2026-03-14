import { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, Pencil, X, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import GlobalLoader from '../components/ui/GlobalLoader';

export default function Categorias() {
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [activeTab, setActiveTab] = useState('expense'); // 'expense' or 'income'
    const [search, setSearch] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({ name: '', color: '#00D4FF', type: 'expense' });

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingCat(null);
        setFormData({ name: '', color: '#00D4FF', type: activeTab });
        setShowModal(true);
    };

    const openEdit = (cat) => {
        if (cat.is_editable === false) {
            toast.error(t('system_category_no_edit'));
            return;
        }
        setEditingCat(cat);
        setFormData({ name: cat.name, color: cat.color || '#00D4FF', type: cat.type || 'expense' });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCat(null);
        setFormData({ name: '', color: '#00D4FF', type: activeTab });
    };

    const handleDelete = async (cat) => {
        if (cat.is_editable === false) {
            toast.error(t('system_category_no_edit'));
            return;
        }
        try {
            await api.delete(`/categories/${cat.id}`);
            toast.success(t('category_deleted'));
            setShowDeleteConfirm(null);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || t('category_delete_error'));
            setShowDeleteConfirm(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error(t('category_name_required'));
            return;
        }
        try {
            if (editingCat) {
                await api.put(`/categories/${editingCat.id}`, formData);
                toast.success(t('category_updated'));
            } else {
                await api.post('/categories', formData);
                toast.success(t('category_created'));
            }
            handleCloseModal();
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || t('category_error'));
        }
    };

    const PRESET_COLORS = [
        '#00D4FF', '#4F46E5', '#10b981', '#ef4444', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
    ];

    const filteredCategories = categories.filter(cat => {
        const matchesSearch = !search || cat.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = (cat.type || 'expense') === activeTab;
        return matchesSearch && matchesType;
    });

    if (loading) return <GlobalLoader fullScreen={true} />;

    return (
        <div className="space-y-6 animate-fade-in">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-0.5">{t('categories')}</h1>
                    <p className="text-finance-muted text-sm">
                        {t('organize_finances')} — {categories.length} {t('categories_label')}
                    </p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> {t('add_category')}
                </button>
            </div>

            {/* Tabs de Gastos/Ingresos */}
            <div className="flex gap-2 p-1 bg-black/20 soft-ui-bg soft-ui-border rounded-xl w-full max-w-sm">
                <button
                    onClick={() => setActiveTab('expense')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'expense' ? 'bg-finance-primary text-white shadow-lg' : 'text-finance-muted hover:text-finance-text dark:hover:text-white hover:bg-white/5'}`}
                >
                    <ArrowDownCircle size={16} /> {t('expenses_section')}
                </button>
                <button
                    onClick={() => setActiveTab('income')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'income' ? 'bg-finance-primary text-white shadow-lg' : 'text-finance-muted hover:text-finance-text dark:hover:text-white hover:bg-white/5'}`}
                >
                    <ArrowUpCircle size={16} /> {t('income_section')}
                </button>
            </div>

            {/* Buscador */}
            <div className="relative max-w-xs">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-finance-muted" />
                <input
                    type="text"
                    placeholder={t('search_categories')}
                    className="input-field soft-ui-input pl-11 text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-finance-muted hover:text-finance-text dark:hover:text-white">
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Grid de categorías */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {filteredCategories.map((cat, idx) => (
                    <div
                        key={cat.id}
                        className={`card flex items-center justify-between gap-3 p-4 bg-white soft-ui-bg soft-ui-border hover:border-finance-primary/30 hover:-translate-y-0.5 transition-all duration-200 group animate-fade-in-up ${cat.is_editable === false ? 'border-dashed border-white/10 opacity-90' : ''}`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="w-9 h-9 rounded-xl flex-shrink-0 shadow-lg ring-2 ring-black/20"
                                style={{ backgroundColor: cat.color || '#00D4FF' }}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-finance-text truncate text-sm">{cat.name}</span>
                                {cat.is_editable === false && (
                                    <span className="text-[10px] text-finance-muted uppercase font-bold tracking-wider">Sistema</span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                            {cat.is_editable !== false && (
                                <>
                                    <button
                                        onClick={() => openEdit(cat)}
                                        className="p-2 rounded-lg text-finance-muted hover:text-finance-primary hover:bg-finance-primary/10 transition-all"
                                        title={t('edit_label')}
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(cat)}
                                        className="p-2 rounded-lg text-finance-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                                        title={t('delete_label')}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="col-span-full text-center py-12 text-finance-muted border-2 border-dashed border-finance-700 rounded-2xl">
                        <Tags size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-medium mb-1">
                            {search ? `${t('no_results_for')} "${search}"` : `No hay categorías de ${activeTab === 'expense' ? 'gastos' : 'ingresos'} todavía`}
                        </p>
                        <button onClick={openCreate} className="text-finance-primary hover:underline font-semibold text-sm">
                            {t('add_category')}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 modal-overlay"
                    onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cat-modal-title"
                >
                    <div className="card p-6 w-full max-w-sm border-white/10 soft-ui-border shadow-2xl animate-scale-in bg-white soft-ui-bg dark:bg-finance-800">
                        <div className="flex justify-between items-center mb-5">
                            <h2 id="cat-modal-title" className="text-xl font-bold">
                                {editingCat ? t('edit_category') : t('add_category')}
                            </h2>
                            <button onClick={handleCloseModal} className="text-finance-muted hover:text-finance-text dark:hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Tipo de Categoría */}
                            {!editingCat && (
                                <div>
                                    <label className="block text-sm mb-2 text-finance-muted font-medium">{t('category_type')}</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'expense' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${formData.type === 'expense' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-black/20 border-white/5 text-finance-muted hover:text-white'}`}
                                        >
                                            <ArrowDownCircle size={14} /> {t('expenses_section')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'income' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${formData.type === 'income' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-black/20 border-white/5 text-finance-muted hover:text-white'}`}
                                        >
                                            <ArrowUpCircle size={14} /> {t('income_section')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Nombre */}
                            <div>
                                <label htmlFor="cat-name" className="block text-sm mb-1.5 text-finance-muted font-medium">
                                    {t('category_name')} *
                                </label>
                                <input
                                    id="cat-name"
                                    type="text"
                                    required
                                    autoFocus
                                    className="input-field soft-ui-input"
                                    placeholder={t('example_categories')}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-sm mb-2 text-finance-muted font-medium">{t('color')}</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-8 h-8 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-finance-800 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        className="h-10 w-12 p-1 bg-black/40 border border-white/10 rounded-lg cursor-pointer flex-shrink-0"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="input-field soft-ui-input flex-1 font-mono text-sm uppercase"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="#00D4FF"
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={handleCloseModal} className="btn-ghost">
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="btn-primary">
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 modal-overlay">
                    <div className="card p-6 w-full max-w-sm border-red-500/20 shadow-2xl animate-scale-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-red-500/15 rounded-xl">
                                <Trash2 size={20} className="text-red-400" />
                            </div>
                            <h2 className="text-lg font-bold">{t('delete_confirm')}</h2>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-4 border border-white/5">
                            <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: showDeleteConfirm.color }} />
                            <span className="font-medium">{showDeleteConfirm.name}</span>
                        </div>
                        <p className="text-finance-muted text-sm mb-5">
                            ⚠️ {t('category_delete_warning')}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 btn-ghost">
                                {t('cancel')}
                            </button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 btn-danger">
                                {t('delete_label')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
