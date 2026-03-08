import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SummaryCard({ title, amount, icon, type, trend, delay = 0 }) {
    const { t, language } = useLanguage();
    const getIconColors = () => {
        switch (type) {
            case 'income': return 'text-emerald-400 bg-emerald-400/15 shadow-[0_0_20px_rgba(52,211,153,0.3)] border border-emerald-400/20';
            case 'expense': return 'text-red-400 bg-red-400/15 shadow-[0_0_20px_rgba(248,113,113,0.3)] border border-red-400/20';
            case 'balance': return 'text-finance-primary bg-finance-primary/15 shadow-[0_0_20px_rgba(0,212,255,0.4)] border border-finance-primary/20';
            default: return 'text-finance-muted bg-finance-muted/10';
        }
    };

    const getAmountColor = () => {
        if (type === 'expense') return 'text-red-400';
        if (type === 'income') return 'text-emerald-400';
        return (Number(amount) || 0) >= 0 ? 'text-finance-text' : 'text-red-400';
    };

    const formatted = `$${(Number(amount) || 0).toLocaleString(language === 'en' ? 'en-US' : 'es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    const animationDelay = { style: { animationDelay: `${delay}ms` } };
    const trendNum = Number(trend);
    const hasTrend = !isNaN(trendNum) && trend !== undefined && trend !== null;

    return (
        <div
            className="card flex items-center gap-4 p-5 hover:border-finance-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 animate-fade-in-up"
            {...animationDelay}
        >
            {/* Ícono */}
            <div className={`p-3.5 rounded-2xl flex-shrink-0 ${getIconColors()}`}>
                {icon}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-finance-muted mb-1 uppercase tracking-wide">{title}</h3>
                <p className={`text-2xl font-bold tracking-tight truncate ${getAmountColor()}`}>{formatted}</p>

                {/* Indicador de tendencia vs mes anterior */}
                {hasTrend && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendNum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trendNum >= 0
                            ? <TrendingUp size={12} />
                            : <TrendingDown size={12} />
                        }
                        <span>{trendNum >= 0 ? '+' : ''}{trendNum.toFixed(1)}% {t('vs_previous_month')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
