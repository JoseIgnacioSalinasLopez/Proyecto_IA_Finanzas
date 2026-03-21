import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Toast({ message, type = 'success', onClose, onUndo, duration = 4000 }) {
    const { t } = useLanguage();
    const timerRef = useRef(null);

    useEffect(() => {
        // Clear any existing timer
        if (timerRef.current) clearTimeout(timerRef.current);

        // Set new timer
        timerRef.current = setTimeout(() => {
            onClose();
            timerRef.current = null;
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [message, duration, onClose]);

    const config = {
        success: {
            classes: 'bg-[var(--toast-bg-success)] border-[var(--toast-border-success)] text-[var(--toast-text-success)]',
            Icon: CheckCircle2,
            iconClass: 'text-[var(--toast-text-success)]',
        },
        error: {
            classes: 'bg-[var(--toast-bg-error)] border-[var(--toast-border-error)] text-[var(--toast-text-error)]',
            Icon: XCircle,
            iconClass: 'text-[var(--toast-text-error)]',
        },
        warning: {
            classes: 'bg-[var(--toast-bg-warning)] border-[var(--toast-border-warning)] text-[var(--toast-text-warning)]',
            Icon: AlertTriangle,
            iconClass: 'text-[var(--toast-text-warning)]',
        },
    };

    const { classes, Icon, iconClass } = config[type] || config.success;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 md:ml-10 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl animate-slide-up max-w-sm w-max min-w-[280px] ${classes}`}
        >
            <Icon size={18} className={`flex-shrink-0 ${iconClass} opacity-80`} />
            <span className="text-sm font-bold flex-1">{message}</span>
            
            {onUndo && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUndo();
                        onClose();
                    }}
                    className="mx-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95 hover:border-white/30"
                >
                    {t('undo')}
                </button>
            )}
            <button
                onClick={onClose}
                className="ml-2 opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                aria-label={t('close_notification')}
            >
                <X size={14} />
            </button>
        </div>
    );
}
