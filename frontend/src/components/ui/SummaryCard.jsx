import React from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import SpotlightCard from './SpotlightCard';
import AnimatedCounter from './AnimatedCounter';

export default function SummaryCard({ title, amount, icon, type, trend, delay = 0, description }) {
    const { t } = useLanguage();

    const getIconColors = () => {
        switch (type) {
            case 'income': return 'text-[#00FFFF] bg-[#00FFFF]/15 dark:shadow-[0_0_20px_rgba(0,212,255,0.3)] border border-[#00FFFF]/20';
            case 'expense': return 'text-[#FF4DA6] bg-[#FF4DA6]/15 dark:shadow-[0_0_20px_rgba(255,77,166,0.3)] border border-[#FF4DA6]/20';
            case 'balance': return 'text-finance-primary bg-finance-primary/15 dark:shadow-[0_0_20px_rgba(0,212,255,0.4)] border border-finance-primary/20';
            default: return 'text-finance-muted bg-white soft-ui-bg soft-ui-border dark:bg-finance-muted/10';
        }
    };

    const getAmountColor = () => {
        if (type === 'expense') return 'text-[#FF4DA6]';
        if (type === 'income') return 'text-[#00FFFF]';
        return (Number(amount) || 0) >= 0 ? 'text-finance-text' : 'text-[#FF4DA6]';
    };

    const getSpotlightColor = () => {
        if (type === 'expense') return 'rgba(255, 77, 166, 0.15)'; // Neon Pink
        if (type === 'income') return 'rgba(0, 255, 255, 0.15)'; // Neon Cyan
        return 'rgba(0, 212, 255, 0.15)'; // Primary Cyan
    }

    const animationDelay = { style: { animationDelay: `${delay}ms` } };
    const trendNum = Number(trend);
    const hasTrend = !isNaN(trendNum) && trend !== undefined && trend !== null;

    return (
        <SpotlightCard className="rounded-[2rem] h-full" spotlightColor={getSpotlightColor()}>
            <div
                className="card flex items-center gap-4 p-5 hover:border-finance-primary/30 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up h-full"
                {...animationDelay}
            >
                {/* Ícono */}
                <div className={`p-3.5 rounded-2xl flex-shrink-0 ${getIconColors()}`}>
                    {icon}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 group/title">
                        <h3 className="text-xs font-semibold text-finance-muted uppercase tracking-wide">{title}</h3>
                        {description && (
                            <div className="relative group/info">
                                <Info size={12} className="text-finance-muted/50 hover:text-finance-primary cursor-help transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-finance-900/95 backdrop-blur-md border border-white/10 rounded-xl text-[10px] w-48 opacity-0 group-hover/info:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl text-white transform scale-95 group-hover/info:scale-100 origin-bottom leading-relaxed">
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-finance-900 border-r border-b border-white/10 rotate-45" />
                                    {description}
                                </div>
                            </div>
                        )}
                    </div>

                    <AnimatedCounter
                        amount={amount}
                        className={`text-2xl font-bold tracking-tight truncate ${getAmountColor()}`}
                    />

                    {/* Indicador de tendencia vs mes anterior */}
                    {hasTrend && (
                        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendNum >= 0 ? 'text-[#00FFFF]' : 'text-[#FF4DA6]'}`}>
                            {trendNum >= 0
                                ? <TrendingUp size={12} />
                                : <TrendingDown size={12} />
                            }
                            <span>{trendNum >= 0 ? '+' : ''}{trendNum.toFixed(1)}% {t('vs_previous_month')}</span>
                        </div>
                    )}
                </div>
            </div>
        </SpotlightCard>
    );
}
