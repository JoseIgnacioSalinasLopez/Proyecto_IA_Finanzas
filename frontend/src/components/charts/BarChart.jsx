import { useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function BarChart({ data, title = 'Comparativa' }) {
    const chartRef = useRef(null);

    const styledData = useMemo(() => {
        if (!data || !data.datasets) return data;

        return {
            ...data,
            datasets: data.datasets.map((ds) => {
                const color = ds.backgroundColor || '#00D4FF';

                return {
                    ...ds,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return color;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        
                        // Si el color es un string hex/rgb, intentar gradiente transparente
                        const baseColor = typeof color === 'string' ? color : '#00D4FF';
                        const isHex = baseColor.startsWith('#');
                        gradient.addColorStop(0, isHex ? hexToRgba(baseColor, 0.95) : baseColor);
                        gradient.addColorStop(0.5, isHex ? hexToRgba(baseColor, 0.7) : baseColor.replace(')', ', 0.7)').replace('rgb', 'rgba'));
                        gradient.addColorStop(1, isHex ? hexToRgba(baseColor, 0.15) : baseColor.replace(')', ', 0.15)').replace('rgb', 'rgba'));
                        return gradient;
                    },
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8,
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
                    color: '#FFFFFF',
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
                stacked: true,
                grid: {
                    color: 'rgba(255,255,255,0.05)',
                    drawBorder: false,
                },
                ticks: { color: '#9EA3B0', font: { family: "'Inter', sans-serif" } },
                beginAtZero: true
            },
            x: {
                stacked: true,
                grid: { display: false, drawBorder: false },
                ticks: { color: '#9EA3B0', font: { family: "'Inter', sans-serif" } }
            }
        }
    };

    return <Bar ref={chartRef} data={styledData} options={options} />;
}
