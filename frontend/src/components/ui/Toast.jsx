import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
    const { t } = useLanguage();
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setTimeout(onClose, duration);
        return () => clearTimeout(timerRef.current);
    }, [onClose, duration]);

    const config = {
        success: {
            classes: 'bg-emerald-900/95 border-emerald-500/40 text-emerald-300',
            Icon: CheckCircle2,
            iconClass: 'text-emerald-400',
        },
        error: {
            classes: 'bg-red-900/95 border-red-500/40 text-red-300',
            Icon: XCircle,
            iconClass: 'text-red-400',
        },
        warning: {
            classes: 'bg-amber-900/95 border-amber-500/40 text-amber-300',
            Icon: AlertTriangle,
            iconClass: 'text-amber-400',
        },
    };

    const { classes, Icon, iconClass } = config[type] || config.success;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl animate-slide-up max-w-sm w-[90vw] ${classes}`}
        >
            <Icon size={18} className={`flex-shrink-0 ${iconClass}`} />
            <span className="text-sm font-medium flex-1">{message}</span>
            <button
                onClick={onClose}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 p-0.5"
                aria-label={t('close_notification')}
            >
                <X size={14} />
            </button>
        </div>
    );
}
