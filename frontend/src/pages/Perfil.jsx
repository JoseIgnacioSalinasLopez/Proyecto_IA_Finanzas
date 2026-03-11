import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Save, User, Phone, MapPin, Briefcase, ShieldCheck, TrendingUp, Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Toast from '../components/ui/Toast';

export default function Perfil() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
    });
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats');
                setStats(res.data.data);
            } catch (error) {
                console.error('Error fetching stats for profile:', error);
            }
        };
        fetchStats();
    }, []);

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/profile', formData);
            showToast(t('profile_updated'));
        } catch (error) {
            showToast(error.response?.data?.message || t('profile_error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const balance = stats?.summary?.balance || 0;
    const income = stats?.summary?.totalIncome || 0;
    const expense = stats?.summary?.totalExpense || 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header / Avatar Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/5 p-8">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <User size={120} className="text-finance-primary" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-[#4F46E5] to-[#00D4FF] flex items-center justify-center text-white font-bold text-4xl shadow-[0_0_30px_rgba(0,212,255,0.3)] border-2 border-white/20">
                            {initials}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-finance-900 rounded-full border-2 border-white/10 flex items-center justify-center text-finance-primary shadow-lg">
                            <ShieldCheck size={20} />
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">{user?.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-finance-muted font-medium text-sm">
                            <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-finance-primary" /> {t('verified_account')}</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} className="text-finance-primary" /> {t('member_since')} {new Date(user?.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX', { year: 'numeric', month: 'long' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Info */}
                    <div className="card bg-white/5 border-white/5 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-finance-primary/10 rounded-xl text-finance-primary">
                                <User size={20} />
                            </div>
                            <h3 className="text-xl font-bold uppercase tracking-wider">{t('personal_details')}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-finance-muted uppercase tracking-widest mb-2">{t('full_name')}</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-finance-muted uppercase tracking-widest mb-2">{t('email_address')}</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-finance-muted uppercase tracking-widest mb-2">{t('phone_number')}</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-finance-muted">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            type="tel"
                                            className="input-field !pl-12"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+52 000 000 0000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-finance-muted uppercase tracking-widest mb-2">{t('language')}</label>
                                    <div className="input-field flex items-center gap-2 opacity-50 cursor-not-allowed">
                                        {language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-finance-muted uppercase tracking-widest mb-2">{t('bio')}</label>
                                <textarea
                                    className="input-field min-h-[100px] resize-none py-3"
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder={t('bio_placeholder') || 'Cuéntanos un poco sobre tus metas financieras...'}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="btn-epic !px-10 flex items-center gap-2"
                                    disabled={loading}
                                >
                                    <Save size={18} />
                                    <span>{loading ? t('saving').toUpperCase() : t('save').toUpperCase()}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Financial Summary Overlay */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card bg-finance-primary/5 border-finance-primary/10 p-6">
                            <div className="text-xs font-black text-finance-muted uppercase tracking-tighter mb-1">{t('total_balance')}</div>
                            <div className={`text-2xl font-black ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                                ${balance.toLocaleString()}
                            </div>
                        </div>
                        <div className="card bg-emerald-500/5 border-emerald-500/10 p-6">
                            <div className="text-xs font-black text-finance-muted uppercase tracking-tighter mb-1">{t('total_income')}</div>
                            <div className="text-2xl font-black text-emerald-400">
                                ${income.toLocaleString()}
                            </div>
                        </div>
                        <div className="card bg-red-500/5 border-red-500/10 p-6">
                            <div className="text-xs font-black text-finance-muted uppercase tracking-tighter mb-1">{t('total_expense')}</div>
                            <div className="text-2xl font-black text-red-400">
                                ${expense.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Cards */}
                <div className="space-y-8">
                    {/* Security Status Card */}
                    <div className="card bg-white/5 border-white/5 p-6">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-finance-primary" />
                            {t('security_status')}
                        </h4>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-finance-muted">{t('levels') || 'Nivel de Protección'}</span>
                                <span className="px-3 py-1 bg-finance-primary/20 text-finance-primary text-[10px] font-black rounded-full uppercase">
                                    {t('high')}
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-finance-primary w-[85%] shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
                            </div>

                            <div className="space-y-3 pt-4">
                                <div className="flex items-center gap-3 text-xs text-finance-text">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    <span>{t('2fa_active') || 'Autenticación activa'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-finance-text">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    <span>{t('encryption_ok') || 'Cifrado de grado bancario'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/30">
                                    <AlertCircle size={14} />
                                    <span>{t('backup_pending') || 'Copia de seguridad semanal'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="card bg-white/5 border-white/5 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <TrendingUp size={80} />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={16} className="text-finance-neon" />
                            {t('activity_overview')}
                        </h4>

                        <div className="space-y-6">
                            {[
                                { icon: <Wallet size={16} />, label: t('last_sync'), value: 'Hace 5 min' },
                                { icon: <Clock size={16} />, label: t('active_sessions') || 'Sesiones Activas', value: '1' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-finance-muted">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-finance-muted uppercase font-black tracking-tighter">{item.label}</div>
                                        <div className="text-sm font-bold text-white">{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
