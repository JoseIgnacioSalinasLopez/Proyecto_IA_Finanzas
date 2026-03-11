import { useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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
        ctx.shadowColor = typeof chart.data.datasets[0]?.borderColor === 'string'
            ? chart.data.datasets[0].borderColor
            : 'rgba(0, 212, 255, 0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
    },
    afterDatasetsDraw: (chart) => {
        chart.ctx.restore();
    }
};

export default function LineChart({ data, title = 'Evolución' }) {
    const chartRef = useRef(null);

    const styledData = useMemo(() => {
        if (!data || !data.datasets) return data;

        return {
            ...data,
            datasets: data.datasets.map((ds) => {
                const color = ds.borderColor || '#00D4FF';

                return {
                    ...ds,
                    borderColor: color,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(0,0,0,0)';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

                        // Intentar crear un gradiente basado en el color de borde
                        const baseColor = typeof color === 'string' ? color : '#00D4FF';
                        const isHex = baseColor.startsWith('#');
                        gradient.addColorStop(0, isHex ? hexToRgba(baseColor, 0.4) : baseColor.replace(')', ', 0.4)').replace('rgb', 'rgba'));
                        gradient.addColorStop(1, 'rgba(0,0,0,0)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.5,
                    pointBackgroundColor: '#0B022D',
                    pointBorderColor: color,
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: color,
                    pointHoverBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointRadius: 0,
                    borderWidth: 3,
                };
            })

        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    usePointStyle: true,
                    boxWidth: 8,
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
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 12,
                titleColor: '#FFFFFF',
                bodyColor: 'rgba(255, 255, 255, 0.8)',
                usePointStyle: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    font: { family: "'Inter', sans-serif", weight: '600' },
                    callback: function (value) {
                        return '$' + value;
                    }
                },
                beginAtZero: true
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: "'Inter', sans-serif", weight: '600' } }
            }
        }
    };

    return <Line ref={chartRef} options={options} data={styledData} plugins={[glowPlugin]} />;
}
