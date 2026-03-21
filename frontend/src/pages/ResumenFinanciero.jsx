import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { Filter, Calendar, TrendingUp, Download, Eye, Tag, FileText, ArrowUpRight, ArrowDownRight, Activity, Zap, CheckCircle2, Shield, AlertTriangle, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Toast from '../components/ui/Toast';
import GlobalLoader from '../components/ui/GlobalLoader';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import DatePickerElite from '../components/ui/DatePickerElite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EMPTY_FORM = { amount: '', type: 'expense', category_id: '', description: '', date: new Date().toISOString().split('T')[0] };

function Modal({ title, onClose, children }) {
    const { t } = useLanguage();
    // Cerrar con Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="card p-8 w-full max-w-lg animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 id="modal-title" className="text-2xl font-bold text-finance-text">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-finance-muted hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all"
                        aria-label={t('cancel')}
                    >
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function TransactionForm({ formData, setFormData, categories, onSubmit, onClose, isEditing }) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    return (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {/* Tipo */}
            <div>
                <label className="block text-sm mb-2 text-finance-muted font-semibold uppercase tracking-wide">
                    {t('movement_type')}
                </label>
                <div className="flex gap-3 p-1 bg-black/30 rounded-2xl border border-white/5" role="group" aria-label={t('movement_type')}>
                    {['expense', 'income'].map(tKey => (
                        <button key={tKey} type="button"
                            onClick={() => setFormData({ ...formData, type: tKey, category_id: '' })}
                            aria-pressed={formData.type === tKey}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${formData.type === tKey
                                ? tKey === 'expense'
                                    ? 'bg-[#FF4DA6]/20 border border-[#FF4DA6]/60 text-[#FF4DA6] shadow-[0_0_16px_rgba(255,77,166,0.25)]'
                                    : 'bg-[#00FFFF]/20 border border-[#00FFFF]/60 text-[#00FFFF] shadow-[0_0_16px_rgba(0,255,255,0.25)]'
                                : 'bg-transparent border border-transparent text-finance-muted hover:text-finance-text hover:bg-white/5'
                                }`}
                        >
                            {tKey === 'expense' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                            {t(tKey === 'expense' ? 'expense_label' : 'income_label')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Monto + Fecha */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tx-amount" className="block text-sm mb-2 text-finance-muted font-medium">{t('amount_label')} ($)</label>
                    <input id="tx-amount" type="number" step="0.01" min="0.01" required placeholder="0.00"
                        className="input-field"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <DatePickerElite
                    id="tx-date"
                    label={t('date_label')}
                    value={formData.date}
                    onChange={val => setFormData({ ...formData, date: val })}
                />
            </div>

            {/* Categoría con Buscador */}
            <div className="space-y-3">
                <label className="block text-sm text-finance-muted font-medium uppercase tracking-wide">
                    {t('category_label')}
                </label>
                
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

                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {(categories || [])
                        .filter(c => c && (c.type || 'expense') === formData.type)
                        .filter(c => c && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, category_id: c.id })}
                                className={`flex items-center gap-2.5 p-2 rounded-xl text-[11px] font-bold border transition-all truncate
                                    ${formData.category_id === c.id 
                                        ? 'bg-finance-primary/10 border-finance-primary/50 text-finance-primary shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-finance-muted hover:border-finance-primary/30 hover:bg-finance-primary/5'}`}
                            >
                                <div 
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                                    style={{ backgroundColor: c.color || '#00D4FF' }} 
                                />
                                <span className="truncate">{c.name}</span>
                            </button>
                        ))}
                    {(categories || []).filter(c => c && (c.type || 'expense') === formData.type && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <p className="col-span-2 py-4 text-center text-[10px] text-finance-muted uppercase tracking-widest opacity-50">
                            {t('no_categories_found')}
                        </p>
                    )}
                </div>
            </div>


            {/* Descripción */}
            <div>
                <label htmlFor="tx-description" className="block text-sm mb-2 text-finance-muted font-medium">{t('description_label')}</label>
                <input id="tx-description" type="text" required
                    placeholder={t('description_placeholder')}
                    className="w-full p-3 rounded-xl bg-black/20 dark:bg-black/40 border border-white/10 text-finance-text transition-colors"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                <button type="button" onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-finance-muted hover:text-white hover:bg-white/5 transition-colors font-medium">
                    {t('cancel')}
                </button>
                <button type="submit"
                    className="btn-primary px-6 py-2.5">
                    {isEditing ? `✓ ${t('update_button')} ` : `✓ ${t('save')} `}
                </button>
            </div>
        </form>
    );
}

// ── Exportar a CSV ────────────────────────────────────────────────────
function exportToCSV(transactions, t, language) {
    const headers = [
        t('date_label'),
        t('movement_type').toUpperCase(),
        t('description_label').toUpperCase(),
        t('category_label').toUpperCase(),
        t('amount_label').toUpperCase()
    ];

    const rows = transactions.map(tx => [
        new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX'),
        (tx.type === 'income' ? t('income_label') : t('expense_label')).toUpperCase(),
        tx.description || '',
        (tx.categories?.name || t('no_custom_categories')).toUpperCase(),
        Number(tx.amount).toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-16;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${t('csv_filename_prefix')}${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ── Exportar a PDF ────────────────────────────────────────────────────
function exportToPDF(transactions, stats, t, language) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const locale = language === 'en' ? 'en-US' : 'es-MX';

    // ── Cabecera Elite ──────────────────────────────────────────
    doc.setFillColor(11, 2, 45); // Deep Navy
    doc.rect(0, 0, pageW, 45, 'F');

    // Grid sutil
    doc.setDrawColor(30, 36, 60);
    for (let i = 0; i < pageW; i += 10) doc.line(i, 0, i, 45);

    // Acento Cian
    doc.setFillColor(0, 212, 255);
    doc.rect(0, 45, pageW, 2.5, 'F');

    // Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('MENTE BILLETE', 15, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 212, 255);
    doc.text(t('pdf_subtitle'), 15, 30);

    // Metadata
    doc.setTextColor(158, 163, 176);
    doc.setFontSize(8);
    doc.text(`${t('pdf_generated_at')}: ${now.toLocaleDateString(locale)} ${now.toLocaleTimeString(locale)}`, pageW - 15, 20, { align: 'right' });
    doc.text(`${t('pdf_hash')} ${Math.random().toString(16).substr(2, 16).toUpperCase()}`, pageW - 15, 28, { align: 'right' });

    // ── Resumen Ejecutivo ────────────────────────────────────────────
    let y = 60;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 2, 45);
    doc.text(t('pdf_summary_title').toUpperCase(), 15, y);
    y += 8;

    const summary = stats?.summary || {};
    const summaryItems = [
        { label: t('pdf_net_balance'), value: summary.balance ?? 0, highlight: true },
        { label: t('pdf_income'), value: summary.totalIncome ?? 0, color: [0, 212, 255] },
        { label: t('pdf_expense'), value: summary.totalExpense ?? 0, color: [255, 77, 166] },
    ];

    const colW = (pageW - 30) / 3;
    summaryItems.forEach((item, i) => {
        const x = 15 + i * colW;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, colW - 4, 20, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, colW - 4, 20, 2, 2, 'D');

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(item.label.toUpperCase(), x + 4, y + 6);

        doc.setFontSize(11);
        doc.setTextColor(item.color ? item.color[0] : 11, item.color ? item.color[1] : 2, item.color ? item.color[2] : 45);
        doc.text(`$${Number(item.value).toLocaleString(locale, { minimumFractionDigits: 2 })}`, x + 4, y + 14);
    });

    y += 32;

    // ── Tabla de Auditoría ────────────────────────────────────────────
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 2, 45);
    doc.text(`${t('pdf_movements_title').toUpperCase()} (${transactions.length})`, 15, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        head: [[t('date_label'), t('movement_type'), t('description_label'), t('category_label'), t('amount_label')]],
        body: transactions.map(tx => [
            new Date(tx.date).toLocaleDateString(locale),
            (tx.type === 'income' ? t('income_label') : t('expense_label')).toUpperCase(),
            (tx.description || '—').toUpperCase(),
            (tx.categories?.name || '—').toUpperCase(),
            `${tx.type === 'income' ? '+' : '-'}$${Number(tx.amount).toLocaleString(locale, { minimumFractionDigits: 2 })}`,
        ]),
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [11, 2, 45], textColor: [0, 212, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold' },
        },
        didParseCell(data) {
            if (data.section === 'body') {
                const tx = transactions[data.row.index];
                if (!tx) return;

                const isIncome = tx.type === 'income';
                const color = isIncome ? [0, 212, 255] : [230, 0, 230]; // Azul Cian y Magenta

                if (data.column.index === 1 || data.column.index === 4) {
                    data.cell.styles.textColor = color;
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }

    });

    // ── Pie de Página ─────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(11, 2, 45);
        doc.rect(0, pageH - 12, pageW, 12, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(158, 163, 176);
        doc.text(t('pdf_footer_msg'), 15, pageH - 5);
        doc.text(`${t('pdf_page_cert')} ${p} / ${pageCount}`, pageW - 15, pageH - 5, { align: 'right' });
    }

    doc.save(`${t('pdf_filename_prefix')}${now.toISOString().split('T')[0]}.pdf`);
}


export default function ResumenFinanciero() {
    const { t, language } = useLanguage();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCell, setEditingCell] = useState(null); // { id, field, value }
    const [filter, setFilter] = useState('all');
    // Filtro de fechas
    const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'thisMonth' | 'lastMonth' | 'custom'
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [chartPeriod, setChartPeriod] = useState('30days'); // '7days' | '30days'


    const showToast = (message, type = 'success', onUndo = null) => setToast({ message, type, onUndo });
    const closeToast = () => setToast(null);

    useEffect(() => {
        fetchAllData();

        // ESCUCHAR RECARGAS GLOBALES
        window.addEventListener('refresh-data', fetchAllData);
        return () => window.removeEventListener('refresh-data', fetchAllData);
    }, []);


    const fetchAllData = async () => {
        try {
            const [txRes, catRes, statsRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/categories'),
                api.get('/stats'),
            ]);
            setTransactions(txRes.data.data);
            setCategories(catRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error(t('error_loading'), error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionsAndStats = async () => {
        try {
            const [txRes, statsRes] = await Promise.all([api.get('/transactions'), api.get('/stats')]);
            setTransactions(txRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) { console.error(error); }
    };

    // Modal de confirmación de eliminación (estilizado)
    // Eliminación diferida con opción de Deshacer (Undo)
    const handleDelete = async (tx) => {
        const id = tx.id;
        const previousTransactions = [...transactions];
        const previousStats = { ...stats };
        
        // 1. Optimistic UI: Eliminar localmente de inmediato
        setTransactions(prev => prev.filter(t => t.id !== id));
        setShowDeleteConfirm(null);

        // 2. Programar borrado real en 5 segundos
        const timeoutId = setTimeout(async () => {
            try {
                await api.delete(`/transactions/${id}`);
                // Notificar a otros para que actualicen balances globales si es necesario
                window.dispatchEvent(new CustomEvent('refresh-data'));
            } catch (error) {
                console.error("Error eliminando:", error);
                showToast(t('error_loading'), 'error');
            }
        }, 5000);

        // 3. Mostrar Toast con botón de deshacer
        showToast(t('movement_deleted'), 'success', () => {
            clearTimeout(timeoutId);
            setTransactions(previousTransactions);
            setStats(previousStats);
            showToast(t('action_undone'));
        });
    };

    const handleInlineSave = async (id, field, value) => {
        const originalTx = transactions.find(t => t.id === id);
        if (!originalTx) return;
        
        // Si el valor no cambió, solo cerrar
        if (String(originalTx[field]) === String(value)) {
            setEditingCell(null);
            return;
        }

        try {
            const numericValue = field === 'amount' ? parseFloat(value) : value;
            
            // Optimistic Update
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: numericValue } : t));
            setEditingCell(null);

            const payload = { 
                ...originalTx, 
                [field]: numericValue,
                amount: parseFloat(field === 'amount' ? value : originalTx.amount)
            };
            
            // Limpiar campos que el backend no espera en el body plano
            delete payload.categories; 
            
            await api.put(`/transactions/${id}`, payload);
            showToast(t('movement_updated'));
            window.dispatchEvent(new CustomEvent('refresh-data'));
        } catch (err) {
            console.error('Error in inline save:', err);
            setTransactions([...transactions]); // Revertir al estado actual (que es el original antes del setTransactions previo)
            showToast(t('registration_error'), 'error');
        }
    };

    const openCreate = () => { setEditingTx(null); setFormData(EMPTY_FORM); setShowModal(true); };

    const openEdit = (tx) => {
        setEditingTx(tx);
        setFormData({
            amount: tx.amount, type: tx.type,
            category_id: tx.category_id || '',
            description: tx.description || '',
            date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const now = new Date();
            const [y, m, d] = formData.date.split('-');
            const dateWithTime = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                date: dateWithTime.toISOString()
            };

            if (editingTx) {
                await api.put(`/transactions/${editingTx.id}`, payload);
                showToast(t('movement_updated'));
            } else {
                await api.post('/transactions', payload);
                showToast(t('movement_registered'));
            }

            // NOTIFICAR A OTROS COMPONENTES
            window.dispatchEvent(new CustomEvent('refresh-data'));

            setShowModal(false); setFormData(EMPTY_FORM); setEditingTx(null);
        } catch (error) {
            showToast(t('registration_error'), 'error');
        }
    };

    const handleCloseModal = () => { setShowModal(false); setEditingTx(null); setFormData(EMPTY_FORM); };

    // Lógica de filtro de fechas
    const applyDateFilter = (tx) => {
        if (dateFilter === 'all') return true;
        const txDate = new Date(tx.date);
        const now = new Date();

        if (dateFilter === 'thisMonth') {
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'lastMonth') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
        }
        if (dateFilter === 'custom' && customDateStart && customDateEnd) {
            const start = new Date(customDateStart);
            const end = new Date(customDateEnd);
            end.setHours(23, 59, 59);
            return txDate >= start && txDate <= end;
        }
        return true;
    };

    const filteredTx = transactions
        .filter(tx => filter === 'all' || tx.type === filter)
        .filter(applyDateFilter)
        .filter(tx => {
            if (!searchTerm) return true;
            const s = searchTerm.toLowerCase();
            return (tx.description || '').toLowerCase().includes(s) || (tx.categories?.name || '').toLowerCase().includes(s);
        });

    const getDateFilterLabel = () => {
        if (dateFilter === 'thisMonth') return t('filter_month');
        if (dateFilter === 'lastMonth') return t('filter_last_month');
        if (dateFilter === 'custom' && customDateStart && customDateEnd)
            return `${customDateStart} — ${customDateEnd}`;
        return t('filter_all');
    };

    // Filtrar timeline para la gráfica de barras por días reales de calendario
    const filteredTimeline = useMemo(() => {
        if (!stats || !stats.timeline) return [];
        const now = new Date();
        const days = chartPeriod === '7days' ? 7 : 30;
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - days);
        cutoff.setHours(0, 0, 0, 0);
        return stats.timeline.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= cutoff;
        });
    }, [stats?.timeline, chartPeriod]);

    if (loading) return <GlobalLoader fullScreen={true} />;
    if (!stats) return <div className="p-6 text-[#FF4DA6]">{t('error_loading')}</div>;

    const expensesData = {
        labels: stats.expensesByCategory.map(c => c.name),
        datasets: [{ label: t('expense_distribution'), data: stats.expensesByCategory.map(c => c.amount), backgroundColor: stats.expensesByCategory.map(c => c.color), borderColor: 'var(--chart-border)', borderWidth: 2 }]
    };

    const savingsRate = stats.summary.totalIncome > 0
        ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1)
        : 0;

    const timelineData = {
        labels: filteredTimeline.map(tKey => {
            const [, m, d] = tKey.date.split('-');
            // Mostramos mes/día más amigable
            return `${d}/${m}`;
        }),
        datasets: [
            {
                label: t('income_label'),
                data: filteredTimeline.map(tKey => tKey.income),
                backgroundColor: '#00FFFF',
                borderRadius: 4,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            },
            {
                label: t('expense_label'),
                data: filteredTimeline.map(tKey => tKey.expense),
                backgroundColor: '#FF4DA6',
                borderRadius: 4,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            },
        ]
    };

    return (
        <div className="min-h-full p-0 text-finance-text dark:text-white animate-fade-in relative z-10">
            {toast && <Toast message={toast.message} type={toast.type} onUndo={toast.onUndo} onClose={closeToast} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-finance-text">{t('finances')}</h1>
                    <p className="text-finance-muted mt-1 text-sm">{t('organize_finances')}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Exportar PDF */}
                    <button
                        onClick={() => {
                            if (filteredTx.length === 0) { showToast(t('no_tx_export'), 'warning'); return; }
                            exportToPDF(filteredTx, stats, t, language);
                            showToast(t('generating_pdf'));
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-[#00D4FF]/40 text-[#00D4FF] bg-[#00D4FF]/5 hover:bg-[#00D4FF]/15 hover:border-[#00D4FF]/70 hover:shadow-[0_0_12px_rgba(0,212,255,0.25)] active:scale-95"
                        title={t('export_pdf')}
                    >
                        <FileText size={16} />
                        <span className="hidden sm:inline">{t('export_pdf')}</span>
                    </button>
                    {/* Exportar CSV */}
                    <button
                        onClick={() => {
                            if (filteredTx.length === 0) { showToast(t('no_tx_export'), 'warning'); return; }
                            exportToCSV(filteredTx, t, language);
                            showToast(t('exporting_tx'));
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-[#00D4FF]/40 text-[#00D4FF] bg-[#00D4FF]/5 hover:bg-[#00D4FF]/15 hover:border-[#00D4FF]/70 hover:shadow-[0_0_12px_rgba(0,212,255,0.25)] active:scale-95"
                        title={t('export_csv')}
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">{t('export_csv')}</span>
                    </button>
                    {/* Nuevo Movimiento */}
                    <button onClick={openCreate}
                        className="btn-epic py-2 px-4 text-sm gap-2 rounded-xl flex items-center font-bold">
                        <Plus size={18} /> {t('add_movement')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-3 card p-6 hover:border-[#00D4FF]/20 transition-all flex flex-col justify-center">
                    <p className="text-finance-muted text-xs uppercase font-semibold tracking-wide mb-2">{t('net_balance')}</p>
                    <AnimatedCounter
                        amount={stats.summary.balance}
                        className={`text-2xl font-bold ${stats.summary.balance >= 0 ? 'text-finance-primary' : 'text-[#FF4DA6]'}`}
                    />
                </div>
                <div className="col-span-12 md:col-span-3 card p-6 flex flex-col justify-center border-[#00FFFF]/20">
                    <p className="text-finance-muted text-xs uppercase font-semibold tracking-wide mb-2">{t('total_income')}</p>
                    <AnimatedCounter
                        amount={stats.summary.totalIncome}
                        className="text-2xl font-bold text-[#00FFFF]"
                    />
                </div>
                <div className="col-span-12 md:col-span-3 card p-6 flex flex-col justify-center border-[#FF4DA6]/20">
                    <p className="text-finance-muted text-xs uppercase font-semibold tracking-wide mb-2">{t('total_expense')}</p>
                    <AnimatedCounter
                        amount={stats.summary.totalExpense}
                        className="text-2xl font-bold text-[#FF4DA6]"
                    />
                </div>
                <div className="col-span-12 md:col-span-3 card p-6 flex flex-col justify-center border-finance-primary/20">
                    <p className="text-finance-muted text-xs uppercase font-semibold tracking-wide mb-2">{t('liquid_balance')}</p>
                    <AnimatedCounter
                        amount={stats.summary.liquidBalance}
                        className="text-2xl font-bold text-finance-text dark:text-white"
                    />
                </div>

                {/* Gráficos */}
                <div className="col-span-12 lg:col-span-8 card p-6 min-h-[360px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-finance-text dark:text-finance-muted">{t('movement_trend')}</h3>
                        <div className="flex bg-white soft-ui-bg dark:bg-black/30 rounded-xl p-1 border border-black/10 soft-ui-border dark:border-white/5 gap-1 shadow-sm dark:shadow-none">
                            <button
                                onClick={() => setChartPeriod('7days')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === '7days'
                                    ? 'bg-finance-primary text-black shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                                    : 'text-finance-muted hover:text-finance-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                {t('filter_week')}
                            </button>
                            <button
                                onClick={() => setChartPeriod('30days')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === '30days'
                                    ? 'bg-finance-primary text-black shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                                    : 'text-finance-muted hover:text-finance-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                {t('filter_30_days')}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative min-h-[250px]">
                        <BarChart data={timelineData} title="" />
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 card p-6 min-h-[360px]">
                    {stats.expensesByCategory.length > 0
                        ? <PieChart data={expensesData} title={t('expense_distribution')} />
                        : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="text-finance-muted text-sm">{t('no_expenses_cat')}</p>
                                <p className="text-finance-muted text-xs mt-1 opacity-60">{t('register_to_see')}</p>
                            </div>
                        )
                    }
                </div>

                {/* Tabla de Movimientos */}
                <div className="col-span-12 lg:col-span-8 card p-5 flex flex-col">
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                            <h3 className="text-base font-bold text-finance-text">{t('movement_history')}</h3>
                            <div className="flex gap-2 flex-wrap items-center">
                                {/* Buscador */}
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-finance-muted" />
                                    <input
                                        type="text"
                                        placeholder={t('search_placeholder')}
                                        aria-label={t('search_placeholder')}
                                        className="pl-8 pr-3 py-2 rounded-xl bg-white soft-ui-input dark:bg-black/40 border border-black/10 dark:border-white/10 text-sm text-finance-text dark:text-white focus:outline-none focus:border-finance-primary w-36 transition-colors shadow-sm dark:shadow-none"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-finance-muted hover:text-white" aria-label={t('clear_search')}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-between gap-2 flex-wrap items-center">
                                    {/* Filtros Tipo */}
                                    {[['all', t('filter_all')], ['income', t('total_income')], ['expense', t('total_expense')]].map(([val, label]) => (
                                        <button key={val} onClick={() => setFilter(val)}
                                            aria-pressed={filter === val}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === val ? 'btn-primary py-2 text-black shadow-md' : 'bg-white soft-ui-bg text-finance-muted hover:text-finance-text border border-black/10 soft-ui-border dark:bg-black/20 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar size={13} className="text-finance-muted flex-shrink-0" />
                            <span className="text-xs text-finance-muted font-medium">{t('period_label')}</span>
                            {[['all', t('filter_all')], ['thisMonth', t('filter_month')], ['lastMonth', t('filter_last_month')], ['custom', t('filter_custom')]].map(([val, label]) => (
                                <button key={val}
                                    onClick={() => { setDateFilter(val); if (val === 'custom') setShowDatePicker(true); else setShowDatePicker(false); }}
                                    aria-pressed={dateFilter === val}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateFilter === val ? 'bg-finance-primary/20 text-finance-primary border border-finance-primary/40 shadow-sm' : 'bg-white soft-ui-bg text-finance-muted hover:text-finance-text border border-black/10 soft-ui-border dark:bg-black/20 dark:border-white/10 shadow-sm'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Rango de fechas personalizado */}
                        {showDatePicker && dateFilter === 'custom' && (
                            <div className="flex gap-4 flex-wrap items-center animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-finance-muted tracking-wider">{t('from_label')}</span>
                                    <div className="w-40">
                                        <DatePickerElite
                                            value={customDateStart}
                                            onChange={val => setCustomDateStart(val)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-finance-muted tracking-wider">{t('to_label')}</span>
                                    <div className="w-40">
                                        <DatePickerElite
                                            value={customDateEnd}
                                            onChange={val => setCustomDateEnd(val)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Barra de Búsqueda Global */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={14} className="text-finance-muted group-focus-within:text-finance-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('search_description')}
                            className="w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-finance-text focus:outline-none focus:border-finance-primary/40 focus:ring-1 focus:ring-finance-primary/20 transition-all placeholder:text-finance-muted/40 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-finance-muted hover:text-finance-text transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto flex-1 overflow-y-auto max-h-[380px]">
                        <table className="w-full text-left border-collapse min-w-[480px]">
                            <thead className="sticky top-0 bg-white soft-ui-header dark:bg-black/60 backdrop-blur-md dark:backdrop-blur-md z-10 border-b border-black/10 dark:border-white/10">
                                <tr className="text-finance-text dark:text-finance-muted text-[10px] uppercase tracking-wider">
                                    <th className="p-3 font-semibold">{t('date_label')}</th>
                                    <th className="p-3 font-semibold">{t('description_label')}</th>
                                    <th className="p-3 font-semibold">{t('categories')}</th>
                                    <th className="p-3 font-semibold">{t('amount_label')}</th>
                                    <th className="p-3 font-semibold text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTx.map(tx => (
                                    <tr key={tx.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/4 transition-colors text-finance-text dark:text-white group">
                                        <td className="p-3 text-sm text-slate-500 dark:text-finance-muted font-medium">
                                            {(() => {
                                                const [y, m, d] = tx.date.split('T')[0].split('-');
                                                return language === 'en' ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
                                            })()}
                                        </td>
                                        <td className="p-3">
                                            {editingCell?.id === tx.id && editingCell?.field === 'description' ? (
                                                <input
                                                    autoFocus
                                                    className="w-full bg-black/5 dark:bg-black/40 border border-finance-primary/40 rounded-lg px-2 py-1.5 text-xs text-finance-text outline-none shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                                                    value={editingCell.value}
                                                    onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleInlineSave(tx.id, 'description', editingCell.value);
                                                        if (e.key === 'Escape') setEditingCell(null);
                                                    }}
                                                    onBlur={() => handleInlineSave(tx.id, 'description', editingCell.value)}
                                                />
                                            ) : (
                                                <div 
                                                    onClick={() => setEditingCell({ id: tx.id, field: 'description', value: tx.description || '' })}
                                                    className="flex items-center gap-2 cursor-pointer hover:text-finance-primary transition-colors group/edit"
                                                >
                                                    <span className="text-sm font-bold truncate max-w-[160px]">
                                                        {tx.description || '—'}
                                                    </span>
                                                    <Pencil size={10} className="text-finance-muted opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap border"
                                                style={{
                                                    backgroundColor: `${tx.categories?.color || '#818cf8'}15`,
                                                    color: tx.categories?.color || '#818cf8',
                                                    borderColor: `${tx.categories?.color || '#818cf8'}30`
                                                }}
                                            >
                                                {tx.categories?.name || t('no_category')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            {editingCell?.id === tx.id && editingCell?.field === 'amount' ? (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    step="0.01"
                                                    className="w-24 bg-black/5 dark:bg-black/40 border border-finance-primary/40 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-finance-text outline-none text-right shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                                                    value={editingCell.value}
                                                    onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleInlineSave(tx.id, 'amount', editingCell.value);
                                                        if (e.key === 'Escape') setEditingCell(null);
                                                    }}
                                                    onBlur={() => handleInlineSave(tx.id, 'amount', editingCell.value)}
                                                />
                                            ) : (
                                                <div 
                                                    onClick={() => setEditingCell({ id: tx.id, field: 'amount', value: tx.amount })}
                                                    className={`flex items-center justify-end gap-1 cursor-pointer hover:text-finance-primary transition-colors group/edit ${tx.type === 'income' ? 'text-[#00FFFF] glow-cyan' : 'text-[#FF4DA6] glow-pink'}`}
                                                >
                                                    <span className="text-sm font-mono font-black">
                                                        {tx.type === 'income' ? '+' : '-'}<AnimatedCounter amount={Number(tx.amount)} className="inline" />
                                                    </span>
                                                    <Pencil size={10} className="text-finance-muted opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => openEdit(tx)} aria-label={`${t('edit_label')} ${t('movement_type')}`}
                                                    className="text-finance-muted hover:text-finance-primary p-2 rounded-lg hover:bg-finance-primary/10 transition-colors">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(tx)} aria-label={`${t('delete_label')} ${t('movement_type')}`}
                                                    className="text-finance-muted hover:text-[#FF4DA6] p-2 rounded-lg hover:bg-[#FF4DA6]/10 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTx.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-finance-muted">
                                            <Filter size={32} className="mx-auto mb-3 opacity-20" />
                                            {searchTerm || filter !== 'all' || dateFilter !== 'all'
                                                ? t('no_results_search')
                                                : t('no_movements')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-finance-muted">
                        <span>{filteredTx.length} {t('transactions').toLowerCase()} {dateFilter !== 'all' ? `· ${getDateFilterLabel()}` : ''}</span>
                        {filteredTx.length > 0 && (
                            <div className="flex gap-3 mt-2 sm:mt-0">
                                <button onClick={() => exportToCSV(filteredTx, t, language)} className="flex items-center gap-1 px-3 py-1.5 border border-[#00D4FF]/40 text-[#00D4FF] bg-[#00D4FF]/5 hover:bg-[#00D4FF]/15 rounded-lg text-xs font-bold transition-all">
                                    <Download size={12} /> CSV
                                </button>
                                <button onClick={() => exportToPDF(filteredTx, stats, t, language)} className="flex items-center gap-1 px-3 py-1.5 border border-[#00D4FF]/40 text-[#00D4FF] bg-[#00D4FF]/5 hover:bg-[#00D4FF]/15 rounded-lg text-xs font-bold transition-all">
                                    <FileText size={12} /> PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tarjeta de Resumen Mensual */}
                <div className="col-span-12 lg:col-span-4 space-y-5">
                    <div className="card p-6 border-finance-primary/20 bg-gradient-to-br from-finance-primary/5 to-transparent">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-finance-primary/20 rounded-xl text-finance-primary">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t('monthly_summary_card')}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                                <span className="text-xs text-finance-muted">{t('monthly_income')}</span>
                                <AnimatedCounter
                                    amount={stats?.summary?.totalIncome || 0}
                                    className="font-bold text-[#00FFFF]"
                                />
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                                <span className="text-xs text-finance-muted">{t('monthly_expenses')}</span>
                                <AnimatedCounter
                                    amount={stats?.summary?.totalSpentThisMonth || 0}
                                    className="font-bold text-[#FF4DA6]"
                                />
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                                <span className="text-xs text-finance-muted font-bold">{t('liquid_balance').toUpperCase()}</span>
                                <AnimatedCounter
                                    amount={stats.summary.liquidBalance}
                                    className="font-black text-[#00FFFF] drop-shadow-[0_0_10px_var(--epic-cyan)]"
                                />
                            </div>

                            <div className="pt-4 border-t border-black/10 dark:border-white/10">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-bold text-finance-text dark:text-white uppercase tracking-wider">{t('monthly_savings')}</span>
                                    <AnimatedCounter
                                        amount={stats.summary.totalIncome - stats.summary.totalExpense}
                                        className={`text-lg font-black ${(stats.summary.totalIncome - stats.summary.totalExpense) >= 0 ? 'text-[#00FFFF]' : 'text-[#FF4DA6]'}`}
                                    />
                                </div>
                            </div>

                            {/* Categoría más gastada del mes */}
                            {stats.monthlyExpensesByCategory?.length > 0 && (
                                <div className="mt-6 p-4 bg-white soft-ui-bg dark:bg-black/20 rounded-2xl border border-black/10 soft-ui-border dark:border-white/5">
                                    <p className="text-[10px] text-finance-muted uppercase font-bold tracking-[0.15em] mb-2">{t('most_spent_category')}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stats.monthlyExpensesByCategory.sort((a, b) => b.amount - a.amount)[0].color }} />
                                            <span className="text-sm font-bold truncate max-w-[120px]">
                                                {stats.monthlyExpensesByCategory.sort((a, b) => b.amount - a.amount)[0].name}
                                            </span>
                                        </div>
                                        <AnimatedCounter
                                            amount={stats.monthlyExpensesByCategory.sort((a, b) => b.amount - a.amount)[0].amount}
                                            className="text-sm font-black text-finance-text dark:text-white"
                                            decimals={0}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <Modal title={editingTx ? t('edit_movement') : t('add_movement')} onClose={handleCloseModal}>
                    <TransactionForm formData={formData} setFormData={setFormData} categories={categories}
                        onSubmit={handleSubmit} onClose={handleCloseModal} isEditing={!!editingTx} />
                </Modal>
            )}

            {/* Modal de Confirmación de Eliminación (estilizado) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 modal-overlay"
                    role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div className="card p-6 w-full max-w-sm border border-black/5 dark:border-[#FF4DA6]/20 animate-scale-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-[#FF4DA6]/15 rounded-xl">
                                <Trash2 size={20} className="text-[#FF4DA6]" />
                            </div>
                            <h2 id="delete-modal-title" className="text-lg font-bold">{t('delete_confirm')}</h2>
                        </div>
                        <p className="text-[#9EA3B0] text-sm mb-2">{t('delete_warning')}</p>
                        <div className="p-3 border border-black/5 dark:border-white/5 rounded-xl mb-5 text-sm">
                            <p className="font-semibold text-finance-text dark:text-white">{showDeleteConfirm.description || t('no_description')}</p>
                            <p className={`font-bold mt-0.5 ${showDeleteConfirm.type === 'income' ? 'text-[#00FFFF]' : 'text-[#FF4DA6]'}`}>
                                {showDeleteConfirm.type === 'income' ? '+' : '-'}<AnimatedCounter amount={Number(showDeleteConfirm.amount)} className="inline" />
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 text-[#9EA3B0] hover:text-finance-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors font-medium text-sm">
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
