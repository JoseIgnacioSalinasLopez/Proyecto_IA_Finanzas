import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Shield, Bell, Moon } from 'lucide-react';
import Toast from '../components/ui/Toast';

export default function Configuracion() {
    const { language, setLanguage, t } = useLanguage();
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        showToast(lang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English', 'success');
    };

    return (
        <div className="flex-1 p-4 md:p-8 animate-fade-in overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-finance-text mb-2 tracking-tight">{t('settings')}</h1>
                    <p className="text-finance-muted font-medium">Gestiona tus preferencias de cuenta y aplicación.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Navegación lateral de Ajustes (Visual) */}
                    <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-finance-primary/10 text-finance-primary rounded-xl font-bold border border-finance-primary/20 shadow-sm transition-all">
                            <Globe size={18} />
                            <span>{t('language')}</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-finance-muted hover:bg-white/5 hover:text-finance-text rounded-xl font-medium transition-all">
                            <Shield size={18} />
                            <span>Seguridad</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-finance-muted hover:bg-white/5 hover:text-finance-text rounded-xl font-medium transition-all">
                            <Bell size={18} />
                            <span>{t('notifications')}</span>
                        </button>
                    </div>

                    {/* Contenido de Ajustes */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="card border-white/5 bg-finance-800/50 backdrop-blur-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Globe size={20} className="text-finance-primary" />
                                {t('select_language')}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleLanguageChange('es')}
                                    className={`
                    p-4 rounded-xl border-2 transition-all flex items-center justify-between
                    ${language === 'es'
                                            ? 'border-finance-primary bg-finance-primary/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                                            : 'border-white/5 bg-white/5 hover:border-white/20'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🇪🇸</span>
                                        <span className="font-bold">{t('spanish')}</span>
                                    </div>
                                    {language === 'es' && <div className="w-2 h-2 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.6)]" />}
                                </button>

                                <button
                                    onClick={() => handleLanguageChange('en')}
                                    className={`
                    p-4 rounded-xl border-2 transition-all flex items-center justify-between
                    ${language === 'en'
                                            ? 'border-finance-primary bg-finance-primary/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                                            : 'border-white/5 bg-white/5 hover:border-white/20'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🇺🇸</span>
                                        <span className="font-bold">{t('english')}</span>
                                    </div>
                                    {language === 'en' && <div className="w-2 h-2 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.6)]" />}
                                </button>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <p className="text-xs text-finance-muted mb-4 italic">
                                    * Cambiar el idioma afectará a todos los menús y etiquetas principales de la aplicación.
                                </p>
                                <div className="flex justify-end">
                                    <button className="btn-primary flex items-center gap-2">
                                        {t('save')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Simulación de otro ajuste */}
                        <div className="card border-white/5 opacity-60">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 text-finance-muted">
                                    <Moon size={20} />
                                    <span className="font-bold">Modo Oscuro</span>
                                </div>
                                <div className="w-12 h-6 bg-finance-primary/20 rounded-full flex items-center px-1">
                                    <div className="w-4 h-4 bg-finance-primary rounded-full shadow-sm ml-auto" />
                                </div>
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
