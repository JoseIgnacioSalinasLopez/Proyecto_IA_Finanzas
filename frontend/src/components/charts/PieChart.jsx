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

        const formattedTotal = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(sum);

        ctx.font = "600 24px Inter, sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";

        const textWidth = ctx.measureText(formattedTotal).width;
        ctx.fillText(formattedTotal, centerX - textWidth / 2, centerY + 10);

        ctx.font = "500 13px Inter, sans-serif";
        ctx.fillStyle = "#9EA3B0";
        const labelText = "Total";
        const labelWidth = ctx.measureText(labelText).width;
        ctx.fillText(labelText, centerX - labelWidth / 2, centerY - 15);
        ctx.save();
    }
};

export default function PieChart({ data, title = 'Distribución' }) {
    const styledData = useMemo(() => {
        if (!data || !data.datasets) return data;
        return {
            ...data,
            datasets: data.datasets.map(ds => {
                const palette = ['#E600E6', '#8C30F5', '#4F46E5', '#00D4FF', '#00FFFF'];
                return {
                    ...ds,
                    backgroundColor: ds.data ? ds.data.map((_, i) => palette[i % palette.length]) : ds.backgroundColor,
                    borderWidth: 6,
                    borderColor: '#130B42',
                    hoverOffset: 18,
                    spacing: 2,
                    borderRadius: 4,
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
                    color: '#FFFFFF',
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
                backgroundColor: 'rgba(11, 2, 45, 0.95)',
                titleColor: '#FFFFFF',
                bodyColor: '#9EA3B0',
                borderColor: 'rgba(255,255,255,0.08)',
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

    return <Doughnut data={styledData} options={options} plugins={[centerTextPlugin]} />;
}
