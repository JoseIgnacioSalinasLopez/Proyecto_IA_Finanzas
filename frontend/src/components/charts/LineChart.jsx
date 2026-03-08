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
                    tension: 0.4,
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
                    color: '#FFFFFF',
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { family: "'Inter', sans-serif", size: 12, weight: '500' }
                }
            },
            title: {
                display: !!title,
                text: title,
                color: '#e5e7eb',
                align: 'start',
                font: { family: "'Inter', sans-serif", size: 16, weight: 'bold' },
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: 'rgba(11, 2, 45, 0.95)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                padding: 14,
                cornerRadius: 12,
                titleColor: '#FFFFFF',
                bodyColor: '#9EA3B0',
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
                    color: 'rgba(255,255,255,0.05)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#9EA3B0',
                    font: { family: "'Inter', sans-serif" },
                    callback: function (value) {
                        return '$' + value;
                    }
                },
                beginAtZero: true
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#9EA3B0', font: { family: "'Inter', sans-serif" } }
            }
        }
    };

    return <Line ref={chartRef} options={options} data={styledData} />;
}
