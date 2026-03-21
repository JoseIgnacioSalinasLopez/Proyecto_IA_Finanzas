import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function (chart) {
        if (chart.config.type !== 'doughnut') return;
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        if (!chartArea) return;

        ctx.restore();
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        const dataset = chart.data.datasets[0];
        const sum = dataset.data.reduce((a, b) => a + Number(b), 0);
        const formattedTotal = '$' + sum.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        const style = getComputedStyle(document.documentElement);
        const titleColor = style.getPropertyValue('--chart-title').trim() || '#1e1e3c';
        const textColor = style.getPropertyValue('--chart-text').trim() || '#6b7280';

        ctx.font = '600 24px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = titleColor;
        const textWidth = ctx.measureText(formattedTotal).width;
        ctx.fillText(formattedTotal, centerX - textWidth / 2, centerY + 10);

        ctx.font = '500 13px Inter, sans-serif';
        ctx.fillStyle = textColor;
        const labelText = 'Total';
        const labelWidth = ctx.measureText(labelText).width;
        ctx.fillText(labelText, centerX - labelWidth / 2, centerY - 15);
        ctx.save();
    }
};

const pieGlowPlugin = {
    id: 'pieGlow',
    beforeDatasetsDraw: (chart) => {
        chart.ctx.save();
        chart.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        chart.ctx.shadowBlur = 15;
        chart.ctx.shadowOffsetX = 0;
        chart.ctx.shadowOffsetY = 8;
    },
    afterDatasetsDraw: (chart) => {
        chart.ctx.restore();
    }
};

export default function PieChart({ data, title = 'Distribución' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const legendColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 30, 60, 0.75)';
    const titleColor = isDark ? '#FFFFFF' : '#1e1e3c';
    const tooltipBg = isDark ? 'rgba(13, 6, 50, 0.95)' : 'rgba(255,255,255,0.97)';
    const tooltipTitle = isDark ? '#FFFFFF' : '#1e1e3c';
    const tooltipBody = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(30,30,60,0.8)';
    const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const styledData = useMemo(() => {
        if (!data || !data.datasets) return data;
        const style = getComputedStyle(document.documentElement);
        const borderColor = style.getPropertyValue('--chart-border').trim() || (isDark ? '#130B42' : '#ffffff');

        return {
            ...data,
            datasets: data.datasets.map(ds => {
                const palette = ['#FF4DA6', '#8C30F5', '#00FFFF', '#4F46E5', '#FFD166', '#2F5BFF', '#00D4FF', '#6A3DF0'];
                return {
                    ...ds,
                    backgroundColor: ds.data ? ds.data.map((_, i) => palette[i % palette.length]) : ds.backgroundColor,
                    borderWidth: 3,
                    borderColor: borderColor,
                    hoverOffset: 20,
                    spacing: 3,
                    borderRadius: 8,
                };
            })
        };
    }, [data, isDark]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        layout: { padding: { right: 10 } },
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: legendColor,
                    usePointStyle: true,
                    pointStyleWidth: 8,
                    padding: 14,
                    boxWidth: 8,
                    font: { family: "'Inter', sans-serif", size: 11, weight: '500' }
                }
            },
            title: {
                display: !!title,
                text: title,
                color: titleColor,
                align: 'start',
                font: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
                padding: { bottom: 16 }
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
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + Number(b), 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return ` ${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            },
        },
    };

    return <Doughnut data={styledData} options={options} plugins={[centerTextPlugin, pieGlowPlugin]} />;
}
