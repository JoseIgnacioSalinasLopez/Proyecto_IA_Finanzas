import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

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

        const formattedTotal = '$' + sum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        // Responsive styles from CSS variables
        const style = getComputedStyle(document.documentElement);
        const titleColor = style.getPropertyValue('--chart-title').trim() || "#FFFFFF";
        const textColor = style.getPropertyValue('--chart-text').trim() || "#9EA3B0";

        ctx.font = "600 24px Inter, sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillStyle = titleColor;

        const textWidth = ctx.measureText(formattedTotal).width;
        ctx.fillText(formattedTotal, centerX - textWidth / 2, centerY + 10);

        ctx.font = "500 13px Inter, sans-serif";
        ctx.fillStyle = textColor;
        const labelText = "Total";
        const labelWidth = ctx.measureText(labelText).width;
        ctx.fillText(labelText, centerX - labelWidth / 2, centerY - 15);
        ctx.save();
    }
};

const pieGlowPlugin = {
    id: 'pieGlow',
    beforeDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
    },
    afterDatasetsDraw: (chart) => {
        chart.ctx.restore();
    }
};

export default function PieChart({ data, title = 'Distribución' }) {
    const styledData = useMemo(() => {
        if (!data || !data.datasets) return data;
        const style = getComputedStyle(document.documentElement);
        const borderColor = style.getPropertyValue('--chart-border').trim() || '#130B42';

        return {
            ...data,
            datasets: data.datasets.map(ds => {
                const palette = ['#E600E6', '#8C30F5', '#4F46E5', '#00D4FF', '#00FFFF'];
                return {
                    ...ds,
                    backgroundColor: ds.data ? ds.data.map((_, i) => palette[i % palette.length]) : ds.backgroundColor,
                    borderWidth: 4,
                    borderColor: borderColor,
                    hoverOffset: 20,
                    spacing: 4,
                    borderRadius: 8,
                }
            })
        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    usePointStyle: true,
                    padding: 20,
                    font: { family: "'Inter', sans-serif", size: 12, weight: '500' }
                }
            },
            title: {
                display: !!title,
                text: title,
                color: '#FFFFFF',
                align: 'start',
                font: { family: "'Inter', sans-serif", size: 16, weight: 'bold' },
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: 'var(--chart-tooltip-bg)',
                titleColor: '#FFFFFF',
                bodyColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
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
