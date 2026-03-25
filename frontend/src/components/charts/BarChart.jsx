import { useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const glowPlugin = {
    id: 'glow',
    beforeDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        const isDark = chart.config.options.scales.y.ticks.color?.includes('255'); // Simple dark check
        ctx.shadowColor = isDark ? 'rgba(0, 255, 255, 0.4)' : 'rgba(0, 255, 255, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
    },
    afterDatasetsDraw: (chart) => {
        chart.ctx.restore();
    }
};

export default function BarChart({ data, title = 'Comparativa' }) {
    const { t, language } = useLanguage();
    const chartRef = useRef(null);
    const { theme } = useTheme();

    const chartTitleLabel = title === 'Comparativa' ? t('comparative_label') : title;
    const isDark = theme === 'dark';

    // Theme-adaptive colors
    const tickColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(30, 30, 60, 0.6)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
    const legendColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 30, 60, 0.7)';
    const titleColor = isDark ? '#FFFFFF' : '#1e1e3c';
    const tooltipBg = isDark ? 'rgba(13, 6, 50, 0.95)' : 'rgba(255,255,255,0.97)';
    const tooltipTitle = isDark ? '#FFFFFF' : '#1e1e3c';
    const tooltipBody = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(30,30,60,0.8)';
    const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const styledData = useMemo(() => {
        if (!data || !data.datasets) return data;

        return {
            ...data,
            datasets: data.datasets.map((ds) => {
                const color = ds.backgroundColor || '#00FFFF';

                return {
                    ...ds,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return color;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);

                        const baseColor = typeof color === 'string' ? color : '#00FFFF';
                        const isHex = baseColor.startsWith('#');
                        gradient.addColorStop(0, isHex ? hexToRgba(baseColor, 0.95) : baseColor);
                        gradient.addColorStop(0.5, isHex ? hexToRgba(baseColor, 0.7) : baseColor.replace(')', ', 0.7)').replace('rgb', 'rgba'));
                        gradient.addColorStop(1, isHex ? hexToRgba(baseColor, 0.15) : baseColor.replace(')', ', 0.15)').replace('rgb', 'rgba'));
                        return gradient;
                    },
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.5,
                    categoryPercentage: 0.7,
                };
            })
        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: legendColor,
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { family: "'Inter', sans-serif", size: 12, weight: '500' }
                }
            },
            title: {
                display: !!chartTitleLabel,
                text: chartTitleLabel,
                color: titleColor,
                align: 'start',
                font: { family: "'Inter', sans-serif", size: 16, weight: 'bold' },
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipTitle,
                bodyColor: tooltipBody,
                borderColor: tooltipBorder,
                borderWidth: 1,
                padding: 14,
                cornerRadius: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-MX', { style: 'currency', currency: 'MXN' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            y: {
                stacked: true,
                grid: { color: gridColor, drawBorder: false },
                ticks: { color: tickColor, font: { family: "'Inter', sans-serif", weight: '600' } },
                beginAtZero: true
            },
            x: {
                stacked: true,
                grid: { display: false, drawBorder: false },
                ticks: { color: tickColor, font: { family: "'Inter', sans-serif", weight: '600' } }
            }
        }
    };

    return <Bar ref={chartRef} data={styledData} options={options} plugins={[glowPlugin]} />;
}
