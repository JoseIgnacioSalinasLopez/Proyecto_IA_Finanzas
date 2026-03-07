import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Plus, Trash2, Pencil, Search, X, Download, Calendar, Filter, FileText } from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import Toast from '../components/ui/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../context/LanguageContext';

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
            className="fixed inset-0 bg-[#0B022D]/85 backdrop-blur-sm flex justify-center items-center z-50 p-4 modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-[#130B42] p-8 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 id="modal-title" className="text-2xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-[#9EA3B0] hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all"
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
    return (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {/* Tipo */}
            <div>
                <label className="block text-sm mb-2 text-[#9EA3B0] font-semibold uppercase tracking-wide">
                    {t('movement_type')}
                </label>
                <div className="flex gap-3" role="group" aria-label={t('movement_type')}>
                    {['expense', 'income'].map(tKey => (
                        <button key={tKey} type="button"
                            onClick={() => setFormData({ ...formData, type: tKey })}
                            aria-pressed={formData.type === tKey}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${formData.type === tKey
                                ? tKey === 'expense'
                                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                                : 'bg-[#0B022D] border-white/10 text-[#9EA3B0] hover:border-white/30'
                                }`}
                        >
                            {tKey === 'expense' ? `💸 ${t('expense_label')}` : `💰 ${t('income_label')}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Monto + Fecha */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tx-amount" className="block text-sm mb-2 text-[#9EA3B0] font-medium">{t('amount_label')} ($)</label>
                    <input id="tx-amount" type="number" step="0.01" min="0.01" required placeholder="0.00"
                        className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-white focus:outline-none focus:border-[#4F46E5] transition-colors"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div>
                    <label htmlFor="tx-date" className="block text-sm mb-2 text-[#9EA3B0] font-medium">{t('date_label')}</label>
                    <input id="tx-date" type="date" required
                        className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-white focus:outline-none focus:border-[#4F46E5] transition-colors"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
            </div>

            {/* Categoría */}
            <div>
                <label htmlFor="tx-category" className="block text-sm mb-2 text-[#9EA3B0] font-medium">{t('category_label')}</label>
                <select id="tx-category" required
                    className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-white focus:outline-none focus:border-[#4F46E5] transition-colors"
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                    <option value="" disabled>{t('select_category')}</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>

            {/* Descripción */}
            <div>
                <label htmlFor="tx-description" className="block text-sm mb-2 text-[#9EA3B0] font-medium">{t('description_label')}</label>
                <input id="tx-description" type="text" required
                    placeholder={t('description_placeholder')}
                    className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-white focus:outline-none focus:border-[#4F46E5] transition-colors"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                <button type="button" onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-[#9EA3B0] hover:text-white hover:bg-white/5 transition-colors font-medium">
                    {t('cancel')}
                </button>
                <button type="submit"
                    className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl font-bold hover:bg-[#4338CA] transition-colors shadow-lg shadow-[#4F46E5]/20 active:scale-95">
                    {isEditing ? `✓ ${t('update_button')}` : `✓ ${t('save')}`}
                </button>
            </div>
        </form>
    );
}

// ── Exportar a CSV ────────────────────────────────────────────────────
function exportToCSV(transactions, t, language) {
    const headers = [t('date_label'), t('movement_type'), t('description_label'), t('category_label'), t('amount_label')];
    const rows = transactions.map(tx => [
        new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX'),
        tx.type === 'income' ? t('income_label') : t('expense_label'),
        tx.description || '',
        tx.categories?.name || t('no_custom_categories'),
        Number(tx.amount).toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mentebillete_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// ── Exportar a PDF ────────────────────────────────────────────────────
function exportToPDF(transactions, stats, t, language) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const locale = language === 'en' ? 'en-US' : 'es-MX';

    // ── Cabecera con fondo de marca ──────────────────────────────────
    doc.setFillColor(11, 2, 45);           // finance-900 #0B022D
    doc.rect(0, 0, pageW, 40, 'F');

    // Barra de acento cian
    doc.setFillColor(0, 212, 255);         // #00D4FF
    doc.rect(0, 40, pageW, 2.5, 'F');

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('MenteBillete', 15, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(158, 163, 176);       // finance-muted
    doc.text(t('pdf_report_title'), 15, 30);

    // Fecha de generación (esquina derecha)
    doc.setFontSize(9);
    doc.text(
        `${t('pdf_generated_at') || 'Generado'}: ${now.toLocaleDateString(locale)} ${now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`,
        pageW - 15, 25,
        { align: 'right' }
    );

    // ── Resumen financiero ────────────────────────────────────────────
    let y = 52;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 40);
    doc.text(t('pdf_summary_title') || 'Resumen del Período', 15, y);
    y += 6;

    const summary = stats?.summary || {};
    const summaryItems = [
        { label: t('pdf_net_balance'), value: summary.balance ?? 0, isBalance: true },
        { label: t('pdf_income'), value: summary.totalIncome ?? 0, isIncome: true },
        { label: t('pdf_expense'), value: summary.totalExpense ?? 0, isExpense: true },
    ];

    const colW = (pageW - 30) / 3;
    summaryItems.forEach((item, i) => {
        const x = 15 + i * colW;

        // Fondo de tarjeta
        const isNeg = item.isBalance && item.value < 0;
        if (item.isIncome) doc.setFillColor(236, 253, 245);
        else if (item.isExpense) doc.setFillColor(254, 242, 242);
        else if (isNeg) doc.setFillColor(254, 226, 226);
        else doc.setFillColor(240, 249, 255);

        doc.roundedRect(x, y, colW - 4, 24, 3, 3, 'F');

        // Etiqueta
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 120);
        doc.text(item.label, x + 6, y + 8);

        // Monto
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        if (item.isIncome) doc.setTextColor(5, 150, 105);
        else if (item.isExpense) doc.setTextColor(220, 38, 38);
        else if (isNeg) doc.setTextColor(220, 38, 38);
        else doc.setTextColor(11, 2, 45);

        const amountStr = `$${Math.abs(item.value).toLocaleString(locale, { minimumFractionDigits: 2 })}${isNeg ? ` ${t('pdf_negative')}` : ''}`;
        doc.text(amountStr, x + 6, y + 19);
    });

    y += 34;

    // ── Tabla de transacciones ────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 40);
    doc.text(`${t('pdf_movements_title') || 'Movimientos'} (${transactions.length})`, 15, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        head: [[t('date_label'), t('movement_type'), t('description_label'), t('category_label'), t('amount_label')]],
        body: transactions.map(tx => [
            new Date(tx.date).toLocaleDateString(locale),
            tx.type === 'income' ? t('income_label') : t('expense_label'),
            tx.description || '—',
            tx.categories?.name || '—',
            `${tx.type === 'income' ? '+' : '-'}$${Number(tx.amount).toLocaleString(locale, { minimumFractionDigits: 2 })}`,
        ]),
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
            lineColor: [230, 232, 240],
            lineWidth: 0.2,
        },
        headStyles: {
            fillColor: [11, 2, 45],
            textColor: [0, 212, 255],
            fontStyle: 'bold',
            fontSize: 9,
        },
        alternateRowStyles: { fillColor: [248, 249, 252] },
        columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 22 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 28 },
            4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        },
        // Colorear celdas de monto por tipo
        didParseCell(data) {
            if (data.column.index === 4 && data.section === 'body') {
                const tx = transactions[data.row.index];
                data.cell.styles.textColor = tx?.type === 'income'
                    ? [5, 150, 105]    // verde
                    : [220, 38, 38];   // rojo
            }
            // Badge para tipo
            if (data.column.index === 1 && data.section === 'body') {
                const tx = transactions[data.row.index];
                data.cell.styles.textColor = tx?.type === 'income'
                    ? [5, 150, 105]
                    : [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 15, right: 15 },
    });

    // ── Por qué este PDF supera una captura de pantalla ───────────────
    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY + 35 < doc.internal.pageSize.getHeight()) {
        doc.setDrawColor(0, 212, 255);
        doc.setLineWidth(0.3);
        doc.line(15, finalY, pageW - 15, finalY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 100);
        doc.text(t('pdf_why_title'), 15, finalY + 6);

        const ventajas = [
            t('pdf_v1'),
            t('pdf_v2'),
            t('pdf_v3'),
            t('pdf_v4'),
        ];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 120);
        ventajas.forEach((v, i) => doc.text(v, 15, finalY + 12 + i * 5));
    }

    // ── Pie de página ─────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(11, 2, 45);
        doc.rect(0, pageH - 12, pageW, 12, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(158, 163, 176);
        doc.text(t('pdf_footer'), 15, pageH - 4);
        doc.text(`${t('pdf_page')} ${p} ${t('pdf_of')} ${pageCount}`, pageW - 15, pageH - 4, { align: 'right' });
    }

    doc.save(`mentebillete_reporte_${now.toISOString().split('T')[0]}.pdf`);
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
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    // Filtro de fechas
    const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'thisMonth' | 'lastMonth' | 'custom'
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });
    const closeToast = () => setToast(null);

    useEffect(() => { fetchAllData(); }, []);

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
    const handleDelete = async (id) => {
        try {
            await api.delete(`/transactions/${id}`);
            setShowDeleteConfirm(null);
            await fetchTransactionsAndStats();
            showToast(t('movement_deleted'));
        } catch (error) {
            showToast(t('error_loading'), 'error');
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
        const payload = { ...formData, amount: Number(formData.amount) };
        try {
            if (editingTx) {
                await api.put(`/transactions/${editingTx.id}`, payload);
                showToast(t('movement_updated'));
            } else {
                await api.post('/transactions', payload);
                showToast(t('movement_registered'));
            }
            setShowModal(false); setFormData(EMPTY_FORM); setEditingTx(null);
            await fetchTransactionsAndStats();
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
            if (!search) return true;
            const s = search.toLowerCase();
            return (tx.description || '').toLowerCase().includes(s) || (tx.categories?.name || '').toLowerCase().includes(s);
        });

    const getDateFilterLabel = () => {
        if (dateFilter === 'thisMonth') return t('filter_month');
        if (dateFilter === 'lastMonth') return t('filter_last_month');
        if (dateFilter === 'custom' && customDateStart && customDateEnd)
            return `${customDateStart} — ${customDateEnd}`;
        return t('filter_all');
    };

    if (loading) return (
        <div className="bg-[#0B022D] min-h-screen p-6 flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#9EA3B0]">{t('loading')}</p>
            </div>
        </div>
    );
    if (!stats) return <div className="p-6 text-red-500">{t('error_loading')}</div>;

    const expensesData = {
        labels: stats.expensesByCategory.map(c => c.name),
        datasets: [{ label: t('expense_distribution'), data: stats.expensesByCategory.map(c => c.amount), backgroundColor: stats.expensesByCategory.map(c => c.color), borderColor: '#161b22', borderWidth: 2 }]
    };

    const timelineData = {
        labels: stats.timeline.map(tKey => tKey.date),
        datasets: [
            { label: t('income_label'), data: stats.timeline.map(tKey => tKey.income), backgroundColor: '#10b981', borderColor: '#10b981', fill: false, tension: 0.3 },
            { label: t('expense_label'), data: stats.timeline.map(tKey => tKey.expense), backgroundColor: '#ef4444', borderColor: '#ef4444', fill: false, tension: 0.3 },
        ]
    };

    const savingsRate = stats.summary.totalIncome > 0
        ? ((stats.summary.balance / stats.summary.totalIncome) * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-[#0B022D] min-h-full p-0 text-white animate-fade-in">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{t('finances')}</h1>
                    <p className="text-[#9EA3B0] mt-1 text-sm">{t('organize_finances')}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Exportar PDF */}
                    <button
                        onClick={() => {
                            if (filteredTx.length === 0) { showToast(t('no_tx_export'), 'warning'); return; }
                            exportToPDF(filteredTx, stats, t, language);
                            showToast(t('generating_pdf'));
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-finance-primary/10 hover:bg-finance-primary/20 border border-finance-primary/30 hover:border-finance-primary/50 text-finance-primary rounded-xl text-sm font-bold transition-all shadow-lg shadow-finance-primary/5"
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
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl text-sm font-medium transition-all"
                        title={t('export_csv')}
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">{t('export_csv')}</span>
                    </button>
                    {/* Nuevo Movimiento */}
                    <button onClick={openCreate}
                        className="bg-[#00D4FF] hover:opacity-90 active:scale-95 text-black font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#00D4FF]/20">
                        <Plus size={18} /> {t('add_movement')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
                {/* Tarjetas de Resumen */}
                <div className="col-span-12 md:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-lg p-6 hover:border-[#00D4FF]/20 transition-all">
                    <p className="text-[#9EA3B0] text-xs uppercase font-semibold tracking-wide mb-2">{t('net_balance')}</p>
                    <h3 className={`text-3xl font-bold ${stats.summary.balance >= 0 ? 'text-[#00D4FF]' : 'text-red-400'}`}>
                        ${stats.summary.balance.toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}
                    </h3>
                    <div className={`text-xs mt-2 font-semibold flex items-center gap-1 ${Number(savingsRate) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {savingsRate >= 0 ? '▲' : '▼'} {Math.abs(savingsRate)}% {t('savings_rate')}
                    </div>
                </div>
                <div className="col-span-12 md:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-lg p-6">
                    <p className="text-[#9EA3B0] text-xs uppercase font-semibold tracking-wide mb-2">{t('total_income')}</p>
                    <h3 className="text-3xl font-bold text-emerald-400">
                        ${stats.summary.totalIncome.toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="col-span-12 md:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-lg p-6">
                    <p className="text-[#9EA3B0] text-xs uppercase font-semibold tracking-wide mb-2">{t('total_expense')}</p>
                    <h3 className="text-3xl font-bold text-red-400">
                        ${stats.summary.totalExpense.toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}
                    </h3>
                </div>

                {/* Gráficos */}
                <div className="col-span-12 lg:col-span-8 bg-[#130B42] rounded-2xl border border-white/5 shadow-lg p-6 h-[320px]">
                    <BarChart data={timelineData} title={t('income_vs_expense_day')} />
                </div>
                <div className="col-span-12 lg:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-lg p-6 h-[320px]">
                    {stats.expensesByCategory.length > 0
                        ? <PieChart data={expensesData} title={t('expense_distribution')} />
                        : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="text-[#9EA3B0] text-sm">{t('no_expenses_cat')}</p>
                                <p className="text-[#9EA3B0] text-xs mt-1 opacity-60">{t('register_to_see')}</p>
                            </div>
                        )
                    }
                </div>

                {/* Tabla de Movimientos */}
                <div className="col-span-12 lg:col-span-7 bg-[#130B42] rounded-2xl border border-white/5 shadow-lg p-5 flex flex-col">
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                            <h3 className="text-base font-bold">{t('movement_history')}</h3>
                            <div className="flex gap-2 flex-wrap items-center">
                                {/* Buscador */}
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EA3B0]" />
                                    <input
                                        type="text"
                                        placeholder={t('search_placeholder')}
                                        aria-label={t('search_placeholder')}
                                        className="pl-8 pr-3 py-2 rounded-xl bg-[#0B022D] border border-white/10 text-sm text-white focus:outline-none focus:border-[#4F46E5] w-36 transition-colors"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9EA3B0] hover:text-white" aria-label={t('clear_search')}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-between gap-2 flex-wrap items-center">
                                    {/* Filtros Tipo */}
                                    {[['all', t('filter_all')], ['income', t('total_income')], ['expense', t('total_expense')]].map(([val, label]) => (
                                        <button key={val} onClick={() => setFilter(val)}
                                            aria-pressed={filter === val}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === val ? 'bg-[#4F46E5] text-white' : 'bg-[#0B022D] text-[#9EA3B0] hover:text-white border border-white/10'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar size={13} className="text-[#9EA3B0] flex-shrink-0" />
                            <span className="text-xs text-[#9EA3B0] font-medium">{t('period_label')}</span>
                            {[['all', t('filter_all')], ['thisMonth', t('filter_month')], ['lastMonth', t('filter_last_month')], ['custom', t('filter_custom')]].map(([val, label]) => (
                                <button key={val}
                                    onClick={() => { setDateFilter(val); if (val === 'custom') setShowDatePicker(true); else setShowDatePicker(false); }}
                                    aria-pressed={dateFilter === val}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateFilter === val ? 'bg-[#4F46E5]/30 text-[#8C8FFF] border border-[#4F46E5]/50' : 'bg-[#0B022D] text-[#9EA3B0] hover:text-white border border-white/10'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Rango de fechas personalizado */}
                        {showDatePicker && dateFilter === 'custom' && (
                            <div className="flex gap-2 flex-wrap items-center animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-[#9EA3B0]">{t('from_label')}</label>
                                    <input type="date" value={customDateStart} onChange={e => setCustomDateStart(e.target.value)}
                                        className="px-2 py-1.5 rounded-lg bg-[#0B022D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#4F46E5]" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-[#9EA3B0]">{t('to_label')}</label>
                                    <input type="date" value={customDateEnd} onChange={e => setCustomDateEnd(e.target.value)}
                                        className="px-2 py-1.5 rounded-lg bg-[#0B022D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#4F46E5]" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto flex-1 overflow-y-auto max-h-[380px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 #0B022D' }}>
                        <table className="w-full text-left border-collapse min-w-[480px]">
                            <thead className="sticky top-0 bg-[#130B42] z-10">
                                <tr className="border-b border-white/10 text-[#9EA3B0] text-xs uppercase">
                                    <th className="p-3 font-semibold">{t('date_label')}</th>
                                    <th className="p-3 font-semibold">{t('description_label')}</th>
                                    <th className="p-3 font-semibold">{t('categories')}</th>
                                    <th className="p-3 font-semibold">{t('amount_label')}</th>
                                    <th className="p-3 font-semibold text-right">{t('actions_label')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTx.map(tx => (
                                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/4 transition-colors">
                                        <td className="p-3 text-sm text-[#BCBFCD]">{new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX')}</td>
                                        <td className="p-3 text-sm text-white font-medium max-w-[160px] truncate">{tx.description || '—'}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded-md text-xs bg-[#0B022D] border border-white/10 text-[#9EA3B0] whitespace-nowrap">
                                                {tx.categories?.name || t('no_category')}
                                            </span>
                                        </td>
                                        <td className={`p-3 text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3 text-right">
                                            {/* Acciones siempre visibles */}
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => openEdit(tx)} aria-label={`${t('edit_label')} ${t('movement_type')}`}
                                                    className="text-[#9EA3B0] hover:text-[#4F46E5] p-2 rounded-lg hover:bg-[#4F46E5]/10 transition-colors">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => setShowDeleteConfirm(tx)} aria-label={`${t('delete_label')} ${t('movement_type')}`}
                                                    className="text-[#9EA3B0] hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTx.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-[#9EA3B0]">
                                            <Filter size={32} className="mx-auto mb-3 opacity-20" />
                                            {search || filter !== 'all' || dateFilter !== 'all'
                                                ? t('no_results_search')
                                                : t('no_movements')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-[#9EA3B0]">
                        <span>{filteredTx.length} {t('transactions').toLowerCase()} {dateFilter !== 'all' ? `· ${getDateFilterLabel()}` : ''}</span>
                        {filteredTx.length > 0 && (
                            <div className="flex gap-3">
                                <button onClick={() => exportToCSV(filteredTx, t, language)} className="flex items-center gap-1 hover:text-white transition-colors">
                                    <Download size={12} /> CSV
                                </button>
                                <button onClick={() => exportToPDF(filteredTx, stats, t, language)} className="flex items-center gap-1 hover:text-finance-primary transition-colors">
                                    <FileText size={12} /> PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de Línea */}
                <div className="col-span-12 lg:col-span-5 bg-[#130B42] rounded-2xl border border-white/5 shadow-lg p-6 h-[450px]">
                    <LineChart data={timelineData} title={t('evolution_title')} />
                </div>
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <Modal title={editingTx ? t('edit_label').concat(' ').concat(t('movement_history').split(' ')[2] || '') : t('add_movement')} onClose={handleCloseModal}>
                    <TransactionForm formData={formData} setFormData={setFormData} categories={categories}
                        onSubmit={handleSubmit} onClose={handleCloseModal} isEditing={!!editingTx} />
                </Modal>
            )}

            {/* Modal de Confirmación de Eliminación (estilizado) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 modal-overlay"
                    role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div className="bg-[#130B42] p-6 rounded-2xl w-full max-w-sm border border-red-500/20 shadow-2xl animate-scale-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-red-500/15 rounded-xl">
                                <Trash2 size={20} className="text-red-400" />
                            </div>
                            <h2 id="delete-modal-title" className="text-lg font-bold">{t('delete_confirm')}</h2>
                        </div>
                        <p className="text-[#9EA3B0] text-sm mb-2">{t('delete_warning')}</p>
                        <div className="p-3 bg-[#0B022D] rounded-xl mb-5 text-sm">
                            <p className="font-semibold">{showDeleteConfirm.description || t('no_description')}</p>
                            <p className={`font-bold mt-0.5 ${showDeleteConfirm.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {showDeleteConfirm.type === 'income' ? '+' : '-'}${Number(showDeleteConfirm.amount).toLocaleString(language === 'en' ? 'en-US' : 'es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 text-[#9EA3B0] hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium text-sm">
                                {t('cancel')}
                            </button>
                            <button onClick={() => handleDelete(showDeleteConfirm.id)}
                                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold text-sm transition-all active:scale-95">
                                {t('delete_label')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
