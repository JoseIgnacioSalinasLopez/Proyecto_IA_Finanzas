import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Globe, Shield, Bell, Moon, Clock, Sun } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/ui/Toast';

export default function Configuracion() {
    const { language, setLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('language'); // 'language', 'security', 'notifications'
    const [toast, setToast] = useState(null);
    const [securityData, setSecurityData] = useState({ current: '', new: '', confirm: '' });
    const [notifSettings, setNotifSettings] = useState({ budget: true, login: true, weekly: false, ai: true });
    const [timelineSettings, setTimelineSettings] = useState({ hide_challenges: false, hide_forecasts: false });

    React.useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await api.get('/preferences');
                if (res.data.success && res.data.data) {
                    const d = res.data.data;
                    setNotifSettings({
                        budget: d.budget_alerts ?? true,
                        login: d.login_alerts ?? true,
                        weekly: d.weekly_reports ?? false,
                        ai: d.ai_tips ?? true
                    });
                    setTimelineSettings({
                        hide_challenges: d.hide_challenges ?? false,
                        hide_forecasts: d.hide_forecasts ?? false
                    });
                }
            } catch (err) {
                console.error('Error fetching preferences:', err);
            }
        };
        fetchPrefs();
    }, []);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        showToast(lang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English', 'success');
    };

    const handleSecuritySave = (e) => {
        e.preventDefault();
        if (securityData.new !== securityData.confirm) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        showToast(t('password_changed'), 'success');
        setSecurityData({ current: '', new: '', confirm: '' });
    };

    const savePreferences = async (newNotifs, newTimeline) => {
        try {
            await api.put('/preferences', {
                budget_alerts: newNotifs.budget,
                login_alerts: newNotifs.login,
                weekly_reports: newNotifs.weekly,
                ai_tips: newNotifs.ai,
                hide_challenges: newTimeline.hide_challenges,
                hide_forecasts: newTimeline.hide_forecasts
            });
            showToast(t('notif_updated'), 'success');
        } catch (err) {
            showToast(t('category_error'), 'error');
        }
    };

    const toggleNotif = (key) => {
        const updated = { ...notifSettings, [key]: !notifSettings[key] };
        setNotifSettings(updated);
        savePreferences(updated, timelineSettings);
    };

    const toggleTimeline = (key) => {
        const updated = { ...timelineSettings, [key]: !timelineSettings[key] };
        setTimelineSettings(updated);
        savePreferences(notifSettings, updated);
    };

    return (
        <div className="flex-1 p-4 md:p-8 animate-fade-in overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold text-finance-text mb-2 tracking-tight">{t('settings')}</h1>
                    <p className="text-finance-muted text-sm">{t('settings_desc')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Navegación lateral de Ajustes */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('language')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border transition-all ${activeTab === 'language' ? 'bg-finance-primary/10 text-finance-primary border-finance-primary/20 shadow-sm' : 'text-finance-muted border-transparent hover:bg-white/5 hover:text-finance-text'}`}
                        >
                            <Globe size={18} />
                            <span>{t('language')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border transition-all ${activeTab === 'security' ? 'bg-finance-primary/10 text-finance-primary border-finance-primary/20 shadow-sm' : 'text-finance-muted border-transparent hover:bg-white/5 hover:text-finance-text'}`}
                        >
                            <Shield size={18} />
                            <span>{t('security')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border transition-all ${activeTab === 'notifications' ? 'bg-finance-primary/10 text-finance-primary border-finance-primary/20 shadow-sm' : 'text-finance-muted border-transparent hover:bg-white/5 hover:text-finance-text'}`}
                        >
                            <Bell size={18} />
                            <span>{t('notifications')}</span>
                        </button>
                    </div>

                    {/* Contenido de Ajustes */}
                    <div className="md:col-span-2 space-y-6">
                        {activeTab === 'language' && (
                            <div className="card border-white/5 bg-white/5 animate-slide-in">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-finance-primary/10 rounded-2xl">
                                        <Globe size={24} className="text-finance-primary" />
                                    </div>
                                    <h2 className="text-xl font-bold text-finance-text">{t('select_language')}</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleLanguageChange('es')}
                                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${language === 'es' ? 'border-finance-primary bg-finance-primary/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">🇪🇸</span>
                                            <span className="font-bold text-finance-text">{t('spanish')}</span>
                                        </div>
                                        {language === 'es' && <div className="w-2 h-2 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.6)]" />}
                                    </button>

                                    <button
                                        onClick={() => handleLanguageChange('en')}
                                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${language === 'en' ? 'border-finance-primary bg-finance-primary/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">🇺🇸</span>
                                            <span className="font-bold text-finance-text">{t('english')}</span>
                                        </div>
                                        {language === 'en' && <div className="w-2 h-2 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.6)]" />}
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5">
                                    <p className="text-xs text-finance-muted mb-4 italic">{t('lang_help')}</p>
                                    <div className="flex justify-end">
                                        <button className="btn-primary flex items-center gap-2">{t('save')}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="card border-white/5 bg-white/5 animate-slide-in">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-red-500/10 rounded-2xl">
                                        <Shield size={24} className="text-red-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-finance-text">{t('account_security')}</h2>
                                </div>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (securityData.new !== securityData.confirm) {
                                        showToast(t('passwords_dont_match'), 'error');
                                        return;
                                    }
                                    if (securityData.new.length < 6) {
                                        showToast(t('password_min'), 'error');
                                        return;
                                    }

                                    try {
                                        await api.put('/profile', { password: securityData.new });
                                        showToast(t('password_changed'), 'success');
                                        setSecurityData({ current: '', new: '', confirm: '' });
                                    } catch (err) {
                                        showToast(err.response?.data?.message || t('profile_error'), 'error');
                                    }
                                }} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-finance-muted mb-1">{t('password_new')}</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                value={securityData.new}
                                                onChange={e => setSecurityData({ ...securityData, new: e.target.value })}
                                                required
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-finance-muted mb-1">{t('password_confirm')}</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                value={securityData.confirm}
                                                onChange={e => setSecurityData({ ...securityData, confirm: e.target.value })}
                                                required
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-finance-muted italic">
                                        {t('password_help')}
                                    </p>
                                    <div className="pt-4 flex justify-end">
                                        <button type="submit" className="btn-epic !py-2.5 !px-8">{t('update_button')}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="card border-white/5 bg-white/5 animate-slide-in space-y-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-finance-neon/10 rounded-2xl">
                                            <Bell size={24} className="text-finance-neon" />
                                        </div>
                                        <h2 className="text-xl font-bold text-finance-text">{t('notifications')}</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'budget', label: t('notif_budget_exceed') },
                                            { id: 'login', label: t('notif_new_login') },
                                            { id: 'weekly', label: t('notif_weekly_report') },
                                            { id: 'ai', label: t('notif_ai_tips') },
                                        ].map(n => (
                                            <div key={n.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                                <span className="font-bold text-sm text-finance-text">{n.label}</span>
                                                <button
                                                    onClick={() => toggleNotif(n.id)}
                                                    className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${notifSettings[n.id] ? 'bg-finance-primary shadow-[0_0_10px_#00D4FF]' : 'bg-white/10'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifSettings[n.id] ? 'translate-x-6' : ''}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-finance-primary/10 rounded-2xl">
                                            <Clock size={24} className="text-finance-primary" />
                                        </div>
                                        <h2 className="text-xl font-bold text-finance-text">{t('timeline_settings')}</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'hide_challenges', label: t('hide_challenges'), desc: t('show_challenges') },
                                            { id: 'hide_forecasts', label: t('hide_forecasts'), desc: t('show_forecasts') },
                                        ].map(s => (
                                            <div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-finance-text">{s.label}</span>
                                                    <span className="text-[10px] text-finance-muted uppercase tracking-tighter">{s.desc}</span>
                                                </div>
                                                <button
                                                    onClick={() => toggleTimeline(s.id)}
                                                    className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${timelineSettings[s.id] ? 'bg-finance-primary shadow-[0_0_10px_#00D4FF]' : 'bg-white/10'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${timelineSettings[s.id] ? 'translate-x-6' : ''}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Apariencia - Modo Claro/Oscuro */}
                        <div className="card border-white/5 bg-white/5 animate-slide-in">
                            <div className="flex justify-between items-center transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl transition-colors ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`}>
                                        {theme === 'dark' ? (
                                            <Moon size={24} className="text-indigo-400" />
                                        ) : (
                                            <Sun size={24} className="text-amber-500" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{t('appearance')}</span>
                                        <span className="text-[10px] text-finance-muted uppercase font-bold tracking-widest">{theme === 'dark' ? t('dark_mode') : t('light_mode')}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`w-14 h-7 rounded-full transition-all duration-300 flex items-center px-1.5 ${theme === 'dark' ? 'bg-finance-primary shadow-[0_0_15px_rgba(0,212,255,0.4)]' : 'bg-black/10'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
