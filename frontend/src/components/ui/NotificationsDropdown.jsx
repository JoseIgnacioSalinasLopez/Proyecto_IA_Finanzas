import React from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function NotificationsDropdown({ notifications, onClose, onClear }) {
    const { t, language } = useLanguage();

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return language === 'en' ? 'JUST NOW' : 'JUSTO AHORA';

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return language === 'en' ? `${diffInMinutes} MIN AGO` : `HACE ${diffInMinutes} MIN`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return language === 'en' ? `${diffInHours} HOURS AGO` : `HACE ${diffInHours} HORAS`;

        const diffInDays = Math.floor(diffInHours / 24);
        return language === 'en' ? `${diffInDays} DAYS AGO` : `HACE ${diffInDays} DÍAS`;
    };

    return (
        <div className="absolute right-0 top-full mt-3 w-80 bg-finance-900 border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-scale-in origin-top-right backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-finance-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-finance-text">{t('notifications')}</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-finance-muted hover:text-finance-text transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {notifications.map((n) => (
                            <div key={n.id} className="p-4 hover:bg-white/5 transition-colors group cursor-pointer">

                                <div className="flex gap-3">
                                    <div className={`mt-0.5 rounded-lg p-1.5 ${n.type === 'alert' ? 'bg-[#FF4DA6]/20 text-[#FF4DA6]' :
                                        n.type === 'success' ? 'bg-[#00FFFF]/20 text-[#00FFFF]' :
                                            'bg-finance-primary/20 text-finance-primary'
                                        }`}>
                                        {n.type === 'alert' ? <AlertTriangle size={14} /> :
                                            n.type === 'success' ? <CheckCircle size={14} /> :
                                                <Info size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-finance-text mb-0.5 leading-tight">{n.title}</p>
                                        <p className="text-[11px] text-finance-muted leading-normal">{n.message}</p>
                                        <p className="text-[9px] text-finance-muted/70 mt-2 font-mono uppercase">
                                            {formatRelativeTime(n.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell size={20} className="text-finance-muted/50" />
                        </div>
                        <p className="text-xs text-finance-muted font-medium italic">{t('no_notifications')}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 bg-white/5 border-t border-white/5 text-center">
                    <button
                        onClick={onClear}
                        className="text-[10px] font-black uppercase tracking-widest text-finance-muted hover:text-finance-primary transition-colors"
                    >
                        {t('clear_all')}
                    </button>
                </div>
            )}
        </div>
    );
}
