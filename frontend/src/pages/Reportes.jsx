import { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
    Chart as ChartJS,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Download, FileText, Calendar, Filter, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Toast from '../components/ui/Toast';

ChartJS.register(
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Filler
);

export default function Reportes() {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });
    const closeToast = () => setToast(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get('/stats');
            setStats(res.data.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!stats || !stats.expensesByCategory) {
            showToast(t('no_tx_export') || 'Sin datos para exportar', 'warning');
            return;
        }
        showToast(t('exporting_tx') || 'Exportando datos...');
        const headers = [t('category_label'), t('amount_label'), t('percentage_label') || 'PORCENTAJE'];
        const total = stats.expensesByCategory.reduce((sum, item) => sum + item.amount, 0);

        const rows = stats.expensesByCategory.map(c => [
            c.name,
            c.amount.toFixed(2),
            `${((c.amount / total) * 100).toFixed(1)}%`
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Metricas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportToPDF = async () => {
        if (!stats || !stats.summary) {
            showToast(t('no_tx_export') || 'Sin datos para exportar', 'warning');
            return;
        }
        setExporting(true);
        showToast(t('generating_pdf') || 'Generando reporte de élite...');
        try {
            const doc = new jsPDF();
            const now = new Date();
            const locale = language === 'en' ? 'en-US' : 'es-MX';
            const pageW = 210;

            // ── Cabecera Elite ──────────────────────────────────────────
            doc.setFillColor(11, 2, 45); // Deep Navy
            doc.rect(0, 0, pageW, 45, 'F');

            // Grid técnico de fondo (sutil - sin alpha para evitar errores)
            doc.setDrawColor(30, 40, 70);
            for (let i = 0; i < pageW; i += 10) doc.line(i, 0, i, 45);
            for (let i = 0; i < 45; i += 10) doc.line(0, i, pageW, i);

            // Acento Cian
            doc.setFillColor(0, 212, 255);
            doc.rect(0, 45, pageW, 2, 'F');

            // Logo y Título
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(26);
            doc.setTextColor(255, 255, 255);
            doc.text('MENTE BILLETE', 15, 22);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 212, 255);
            doc.text('PLATAFORMA DE GESTIÓN PATRIMONIAL ELITE', 15, 30);

            doc.setTextColor(158, 163, 176);
            doc.text(`${t('pdf_generated_at')}: ${now.toLocaleDateString(locale)} | ${now.toLocaleTimeString(locale)}`, pageW - 15, 25, { align: 'right' });
            doc.text(`ID DE REPORTE: TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, pageW - 15, 30, { align: 'right' });

            // ── Bloque 1: Resumen Ejecutivo ────────────────────────────────
            let y = 65;
            doc.setFontSize(14);
            doc.setTextColor(11, 2, 45);
            doc.setFont('helvetica', 'bold');
            doc.text(t('executive_summary') || 'RESUMEN EJECUTIVO', 15, y);

            y += 8;
            const summaryTable = [
                [t('net_balance_report'), `$${stats.summary.balance.toLocaleString(locale, { minimumFractionDigits: 2 })}`],
                [t('daily_burn_rate') || 'TASA DE QUEMADO DIARIO', `$${stats.summary.dailyBurnRate.toLocaleString(locale, { minimumFractionDigits: 2 })}`],
                [t('reserve_days') || 'DÍAS DE RESERVA', `${stats.summary.bufferTime} ${t('days').toLowerCase()}`],
                [t('risk_level_label'), stats.summary.riskLevel]
            ];

            autoTable(doc, {
                startY: y,
                body: summaryTable,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 3, textColor: [30, 41, 59] },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 80 },
                    1: { halign: 'right', textColor: [0, 212, 255], fontStyle: 'bold' }
                }
            });

            // ── Bloque 2: Distribución de Activos ───────────────────────────
            y = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.setTextColor(11, 2, 45);
            doc.text(t('expenses_by_category'), 15, y);

            const catData = stats.expensesByCategory.map(c => [
                c.name.toUpperCase(),
                `$${c.amount.toLocaleString(locale, { minimumFractionDigits: 2 })}`,
                `${((c.amount / (stats.summary.totalExpense || 1)) * 100).toFixed(1)}%`
            ]);

            autoTable(doc, {
                startY: y + 5,
                head: [[t('category_label'), t('amount_label'), '%']],
                body: catData,
                theme: 'grid',
                headStyles: { fillColor: [11, 2, 45], textColor: [0, 212, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: {
                    1: { halign: 'right' },
                    2: { halign: 'right', fontStyle: 'bold' }
                },
                didParseCell(data) {
                    if (data.column.index === 1 && data.section === 'body') {
                        data.cell.styles.textColor = [0, 212, 255]; // Cian para montos destacados
                    }
                }
            });

            // ── Pie de Página ──────────────────────────────────────────
            const pageH = 297;
            doc.setFillColor(11, 2, 45);
            doc.rect(0, pageH - 15, pageW, 15, 'F');
            doc.setFontSize(8);
            doc.setTextColor(158, 163, 176);
            doc.text('CONIDENCIALIDAD NIVEL 4 | MENTE BILLETE DIGITAL ASSET MANAGEMENT', 15, pageH - 7);
            doc.text(`PÁGINA 1 DE 1`, pageW - 15, pageH - 7, { align: 'right' });

            doc.save(`MB_ELITE_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
            showToast(t('pdf_generated') || 'Reporte generado con éxito');
        } catch (error) {
            console.error('PDF Export error:', error);
            showToast(t('error_exporting_pdf') || 'Error al generar el PDF', 'error');
        } finally {
            setExporting(false);
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 border-4 border-white/10 border-t-finance-primary rounded-full animate-spin" />
                <p className="text-finance-muted animate-pulse">{t('loading')}</p>
            </div>
        );
    }

    // Chart Data: Wealth Evolution (Cumulative)
    let currentAcc = 0;
    const wealthData = stats.timeline.map(d => {
        currentAcc += (d.income - d.expense);
        return currentAcc;
    });

    const lineData = {
        labels: stats.timeline.map(d => d.date),
        datasets: [
            {
                label: t('wealth_evolution'),
                data: wealthData,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 5,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' } }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#fff',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1
            }
        },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { display: false } },
            y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-finance-text">{t('strategic_analysis')}</h1>
                    <p className="text-finance-muted text-sm">{t('report_subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="btn-primary !bg-white/5 !text-white flex items-center gap-2 border border-white/10 hover:!bg-white/10"
                    >
                        <Download size={18} />
                        CSV
                    </button>
                    <button
                        onClick={exportToPDF}
                        disabled={exporting}
                        className="btn-primary flex items-center gap-2"
                    >
                        {exporting ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <FileText size={18} />
                        )}
                        {t('export_pdf')}
                    </button>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Timeline Chart */}
                <div className="lg:col-span-2 card p-5 flex flex-col min-h-[500px] bg-white/5">
                    <h2 className="text-sm font-bold text-finance-muted uppercase tracking-wider mb-6">{t('wealth_evolution')}</h2>
                    <div className="flex-1 min-h-[300px]">
                        <Line data={lineData} options={chartOptions} />
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] text-finance-muted uppercase tracking-widest mb-1">{t('max_income')}</p>
                            <p className="text-emerald-400 font-bold text-lg">${Math.max(...stats.timeline.map(d => d.income), 0).toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-finance-muted uppercase tracking-widest mb-1">{t('max_expense')}</p>
                            <p className="text-red-400 font-bold text-lg">${Math.max(...stats.timeline.map(d => d.expense), 0).toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-finance-muted uppercase tracking-widest mb-1">{t('daily_avg')}</p>
                            <p className="text-finance-primary font-bold text-lg">${stats.summary.dailyBurnRate.toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-finance-muted uppercase tracking-widest mb-1">{t('risk_level_label')}</p>
                            <p className={`font-bold text-lg ${stats.summary.riskLevel === 'CRÍTICO' ? 'text-red-500' : 'text-emerald-400'}`}>
                                {stats.summary.riskLevel === 'BAJO' ? t('risk_low') :
                                    stats.summary.riskLevel === 'MEDIO' ? t('risk_medium') :
                                        stats.summary.riskLevel === 'CRÍTICO' ? t('risk_critical') :
                                            stats.summary.riskLevel}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Summary Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-5 space-y-4">
                        <h2 className="text-sm font-bold text-finance-muted uppercase tracking-wider">{t('key_metrics')}</h2>
                        <div className="space-y-4">
                            {[
                                { label: t('net_balance_report'), value: stats.summary.balance, color: 'text-finance-primary' },
                                { label: t('projected_savings'), value: stats.summary.balance * 0.2, color: 'text-emerald-400' },
                                { label: t('reserve_days'), value: stats.summary.bufferTime, suffix: ` ${t('days').toLowerCase()}`, color: 'text-orange-400' }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-xs text-finance-muted font-medium">{item.label}</span>
                                    <span className={`font-bold ${item.color}`}>
                                        {item.suffix ? `${item.value}${item.suffix}` : `$${item.value.toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
