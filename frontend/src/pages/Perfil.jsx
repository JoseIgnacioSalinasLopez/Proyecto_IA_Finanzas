import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
    Save, User, Phone, MapPin, Briefcase, ShieldCheck,
    TrendingUp, Wallet, Clock, CheckCircle2, AlertCircle,
    Camera, Globe, Lock, ChevronRight, Activity, Zap,
    Smartphone, Monitor, Tablet, MoreHorizontal, Calendar, Upload,
    Eye, EyeOff, Sparkles, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import GlobalLoader from '../components/ui/GlobalLoader';

const AVATAR_PRESETS = [
    'from-[#4F46E5] to-[#00D4FF]',
    'from-[#FF4DA6] to-[#FF90D2]',
    'from-[#00FFFF] to-[#4DFFFF]',
    'from-[#FFD700] to-[#FFA500]',
    'from-[#8B5CF6] to-[#D946EF]',
    'from-[#10B981] to-[#3B82F6]'
];

export default function Perfil() {
    const { user, refreshUser } = useAuth();
    const { t, language } = useLanguage();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url || '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState(null);
    const [avatarPreset, setAvatarPreset] = useState(0);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const fileInputRef = useRef(null);
    const [activities, setActivities] = useState([]);
    const [fetchingActivities, setFetchingActivities] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [verifyingPhone, setVerifyingPhone] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [smsAlerts, setSmsAlerts] = useState(false);

    // Formateador de teléfono
    const formatPhone = (value) => {
        if (!value) return value;
        const phone = value.replace(/[^\d]/g, '');
        const len = phone.length;
        if (len < 3) return `+${phone}`;
        if (len < 5) return `+${phone.slice(0, 2)} (${phone.slice(2)})`;
        if (len < 8) return `+${phone.slice(0, 2)} (${phone.slice(2, 5)}) ${phone.slice(5)}`;
        return `+${phone.slice(0, 2)} (${phone.slice(2, 5)}) ${phone.slice(5, 9)}-${phone.slice(9, 13)}`;
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const simulatePhoneVerification = () => {
        setVerifyingPhone(true);
        setTimeout(() => {
            setVerifyingPhone(false);
            setPhoneVerified(true);
            toast.success(t('phone_verified') || 'Teléfono verificado');
        }, 2000);
    };

    useEffect(() => {
        const fetchStatsAndActivity = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    api.get('/stats'),
                    api.get('/activity')
                ]);
                setStats(statsRes.data.data);
                setActivities(activityRes.data.data);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
                setFetchingActivities(false);
            }
        };
        fetchStatsAndActivity();
    }, []);

    const completeness = useMemo(() => {
        let score = 0;
        if (formData.name) score += 20;
        if (formData.email) score += 20;
        if (formData.phone && formData.phone.length > 10) score += 20;
        if (formData.bio && formData.bio.length > 20) score += 20;
        if (formData.avatar_url) score += 20;
        return score;
    }, [formData]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.put('/profile', formData);
            await refreshUser();
            toast.success(t('profile_updated'));
            // Refetch activity after update
            const activityRes = await api.get('/activity');
            setActivities(activityRes.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('profile_error'));
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            toast.error(t('passwords_dont_match'));
            return;
        }

        setSaving(true);
        try {
            await api.put('/auth/password', {
                currentPassword: passwordForm.current,
                newPassword: passwordForm.new
            });
            toast.success(t('password_changed_success'));
            setShowPasswordModal(false);
            setPasswordForm({ current: '', new: '', confirm: '' });
            // Refresh activity
            const activityRes = await api.get('/activity');
            setActivities(activityRes.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('password_change_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error(t('invalid_file'));
            return;
        }

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('avatar', file);

            const { data } = await api.post('/profile/avatar', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (data.success) {
                setFormData(prev => ({ ...prev, avatar_url: data.data.avatar_url }));
                await refreshUser();
                toast.success(t('avatar_updated'));
                // Refresh activity
                const activityRes = await api.get('/activity');
                setActivities(activityRes.data.data);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error(t('upload_error'));
        } finally {
            setUploading(false);
            setShowAvatarPicker(false);
        }
    };

    const initials = (formData.name || user?.name || 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const balance = stats?.summary?.balance || 0;
    const income = stats?.summary?.totalIncome || 0;
    const expense = stats?.summary?.totalExpense || 0;
    const topCategory = stats?.summary?.topCategory || t('none');

    // Real device info
    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let os = "System";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        if (ua.indexOf("Mac") !== -1) os = "macOS";
        if (ua.indexOf("X11") !== -1) os = "Linux";
        if (ua.indexOf("Linux") !== -1) os = "Linux";
        if (ua.indexOf("Android") !== -1) os = "Android";
        if (ua.indexOf("iPhone") !== -1) os = "iOS";

        let browser = "Web Browser";
        if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("MSIE") !== -1 || !!document.documentMode === true) browser = "IE";

        return `${os} • ${browser}`;
    };

    if (loading) return <GlobalLoader fullScreen={true} />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-8 pb-12 px-4"
        >
            {/* --- HEADER / AVATAR SECTION --- */}
            <div className="relative z-10 rounded-[2.5rem] bg-finance-900/40 backdrop-blur-xl border border-white/10 p-10 shadow-2xl">
                {/* Background Decorations - Wrapped in a clipped container to avoid bleeding while allowing dropdowns to overlap */}
                <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-finance-primary/20 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#FF4DA6]/10 rounded-full blur-[100px]" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="relative group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                            className={`w-40 h-40 rounded-[2rem] flex items-center justify-center text-white font-black overflow-hidden shadow-2xl border-4 border-white/20 cursor-pointer transition-all active:scale-95 relative group`}
                        >
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center text-5xl bg-gradient-to-tr ${AVATAR_PRESETS[avatarPreset]}`}>
                                    {initials}
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={32} className="text-white" />
                            </div>

                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-t-finance-primary border-white/20 rounded-full animate-spin mb-2" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">{t('uploading')}</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Avatar Picker Dropdown */}
                        <AnimatePresence>
                            {showAvatarPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute top-full mt-4 p-6 bg-[#0a0f1d] border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] grid grid-cols-3 gap-4 w-60 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0"
                                >
                                    {AVATAR_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const updatedData = { ...formData, avatar_url: '' };
                                                setAvatarPreset(idx);
                                                setFormData(updatedData);
                                                setShowAvatarPicker(false);
                                                api.put('/profile', updatedData);
                                            }}
                                            className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${preset} border-2 ${avatarPreset === idx && !formData.avatar_url ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent'} transition-all hover:scale-110 active:scale-90`}
                                        />
                                    ))}

                                    {/* Botón de subida personalizada */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="col-span-3 mt-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <Upload size={14} />
                                        {t('upload_avatar')}
                                    </button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="text-center md:text-left flex-1 min-w-0">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h1 className="text-4xl md:text-5xl font-black text-finance-text tracking-tight uppercase truncate">
                                {formData.name || user?.name}
                            </h1>
                            <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-finance-primary/20 text-finance-primary border border-finance-primary/30 hidden sm:inline-flex items-center gap-1.5 uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,255,255,0.15)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-finance-primary shadow-[0_0_10px_var(--epic-cyan)] animate-pulse" />
                                {user?.account_type === 'elite' ? t('account_type_elite') : (user?.account_type === 'basic' ? t('account_type_basic') : t('account_type'))}
                            </span>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-finance-muted font-bold text-xs tracking-wide uppercase opacity-70">
                            <span className="flex items-center gap-2"><Globe size={14} className="text-finance-primary" /> {user?.email}</span>
                            <span className="flex items-center gap-2"><Calendar size={14} className="text-finance-primary" /> {t('member_since')} {new Date(user?.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX', { year: 'numeric', month: 'short' })}</span>
                        </div>

                        {/* Completeness Bar */}
                        <div className="mt-8 max-w-sm mx-auto md:mx-0">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-finance-muted mb-2">
                                <span>{t('profile_completeness')}</span>
                                <span className="text-finance-primary">{completeness}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completeness}%` }}
                                    className="h-full bg-gradient-to-r from-finance-primary to-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- LEFT COLUMN: PERSONAL DETAILS --- */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="card-elite p-10 group overflow-hidden relative">
                        {/* Decorative Icon Background */}
                        <User size={150} className="absolute -right-10 -bottom-10 text-white/5 group-hover:text-finance-primary/10 transition-colors duration-500" />

                        <div className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="p-3 bg-finance-primary/10 rounded-2xl text-finance-primary shadow-inner">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-finance-text">{t('personal_details')}</h3>
                                <p className="text-xs text-finance-muted font-medium mt-1">{t('manage_info')}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-finance-muted uppercase tracking-[0.3em] ml-1">{t('full_name')}</label>
                                    <input
                                        type="text"
                                        className="input-field-elite"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t('full_name')}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-finance-muted uppercase tracking-[0.3em] ml-1">{t('email_address')}</label>
                                    <input
                                        type="email"
                                        className="input-field-elite opacity-60"
                                        value={formData.email}
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-black text-finance-muted uppercase tracking-[0.3em]">{t('phone_number')}</label>
                                        {phoneVerified && <span className="text-[9px] font-black text-finance-neon flex items-center gap-1 uppercase tracking-widest"><CheckCircle2 size={10} /> {t('verified') || 'VERIFICADO'}</span>}
                                    </div>
                                    <div className="relative group">
                                        <Phone size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${phoneVerified ? 'text-finance-neon' : 'text-finance-primary/50'}`} />
                                        <input
                                            type="tel"
                                            className={`input-field-elite !pl-14 !pr-24 transition-all ${phoneVerified ? 'border-finance-neon/30' : ''}`}
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            placeholder="+52 (555) 000-0000"
                                        />
                                        <button
                                            type="button"
                                            onClick={simulatePhoneVerification}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${phoneVerified ? 'bg-finance-neon/10 text-finance-neon border border-finance-neon/20 cursor-default' : 'bg-finance-primary/10 text-finance-primary hover:bg-finance-primary/20 border border-finance-primary/20 animate-pulse-slow'}`}
                                            disabled={verifyingPhone || phoneVerified || !formData.phone}
                                        >
                                            {verifyingPhone ? (
                                                <div className="w-3 h-3 border-2 border-t-transparent border-finance-primary rounded-full animate-spin" />
                                            ) : phoneVerified ? t('verified') || 'OK' : t('verify') || 'VERIFICAR'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 px-1">
                                        <button
                                            type="button"
                                            onClick={() => setSmsAlerts(!smsAlerts)}
                                            className={`w-8 h-4 rounded-full transition-all relative ${smsAlerts ? 'bg-finance-neon' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${smsAlerts ? 'left-4.5' : 'left-0.5'}`} />
                                        </button>
                                        <span className="text-[10px] font-bold text-finance-muted uppercase tracking-wider">{t('sms_alerts') || 'Recibir alertas de seguridad vía SMS'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-finance-muted uppercase tracking-[0.3em] ml-1">{t('language')}</label>
                                    <div className="input-field-elite flex items-center justify-between opacity-80 cursor-default">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
                                            <span className="font-bold">{language === 'es' ? 'Español' : 'English'}</span>
                                        </div>
                                        <Globe size={16} className="text-finance-muted" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black text-finance-muted uppercase tracking-[0.3em]">{t('bio')}</label>
                                    <div className="flex items-center gap-3">
                                        {formData.bio.length > 10 && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-[9px] font-black text-finance-primary flex items-center gap-1 uppercase tracking-widest bg-finance-primary/5 px-2 py-0.5 rounded-full border border-finance-primary/10"
                                            >
                                                <Sparkles size={10} /> {t('ai_synced') || 'Sincronizado con IA'}
                                            </motion.span>
                                        )}
                                        <span className={`text-[10px] font-black tracking-widest ${formData.bio.length > 230 ? 'text-[#FF4DA6] animate-pulse' : 'text-finance-muted/40'}`}>
                                            {formData.bio.length} / 250
                                        </span>
                                    </div>
                                </div>
                                <textarea
                                    className={`input-field-elite min-h-[120px] resize-none py-4 leading-relaxed transition-all ${formData.bio.length > 230 ? 'border-[#FF4DA6]/30' : ''}`}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value.slice(0, 250) })}
                                    placeholder={t('bio_placeholder')}
                                />
                                <p className="text-[9px] font-bold text-finance-muted/50 mt-1 ml-1 uppercase tracking-wider">
                                    {t('ai_bio_hint') || '* Tu biografía ayuda a la IA a personalizar tus consejos financieros.'}
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="btn-epic !px-12 flex items-center gap-3 group"
                                    disabled={saving}
                                >
                                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                    <span className="font-black tracking-widest">{saving ? t('saving').toUpperCase() : t('save_changes').toUpperCase()}</span>
                                    <ChevronRight size={18} />
                                </motion.button>
                            </div>
                        </form>
                    </div>

                    {/* --- FINANCIAL SNAPSHOT CARDS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                label: t('total_balance'),
                                amount: balance,
                                color: balance >= 0 ? 'text-finance-text' : 'text-[#FF4DA6]',
                                bg: 'bg-finance-primary/5 border-finance-primary/10',
                                icon: <Wallet size={20} className="text-finance-primary" />
                            },
                            {
                                label: t('total_income'),
                                amount: income,
                                color: 'text-[#00FFFF]',
                                bg: 'bg-[#00FFFF]/5 border-[#00FFFF]/10',
                                icon: <TrendingUp size={20} className="text-[#00FFFF]" />
                            },
                            {
                                label: t('total_expense'),
                                amount: expense,
                                color: 'text-[#FF4DA6]',
                                bg: 'bg-[#FF4DA6]/5 border-[#FF4DA6]/10',
                                icon: <Activity size={20} className="text-[#FF4DA6]" />
                            }
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className={`card p-8 ${card.bg} border relative overflow-hidden group`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                    {card.icon}
                                </div>
                                <div className="text-[10px] font-black text-finance-muted uppercase tracking-widest mb-3">{card.label}</div>
                                <AnimatedCounter
                                    amount={card.amount}
                                    className={`text-3xl font-black ${card.color}`}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT COLUMN: SECURITY & STATS --- */}
                <div className="space-y-8">
                    {/* Activity Overview / Advanced Stats */}
                    <div className="card-elite p-8 relative overflow-hidden group">
                        <Zap size={100} className="absolute -right-8 -top-8 text-finance-neon/5 group-hover:text-finance-neon/10 transition-colors" />
                        <h4 className="text-sm font-black text-finance-text uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Activity size={18} className="text-finance-neon" />
                            {t('activity_overview')}
                        </h4>

                        <div className="space-y-6 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                            {fetchingActivities ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-10 h-10 bg-finance-text/5 dark:bg-white/5 rounded-xl text-finance-text" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-2 bg-finance-text/5 dark:bg-white/5 rounded w-1/3" />
                                                <div className="h-2 bg-finance-text/5 dark:bg-white/5 rounded w-2/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-8 text-finance-muted font-bold italic opacity-50">
                                    {t('no_activity')}
                                </div>
                            ) : (
                                activities.map((act, idx) => (
                                    <div key={act.id} className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-finance-text/5 dark:bg-white/5 border border-finance-text/10 dark:border-white/5 flex items-center justify-center text-finance-muted shrink-0 shadow-lg">
                                            {act.action.includes('LOGIN') ? <Globe size={16} /> :
                                                act.action.includes('PASSWORD') ? <Lock size={16} /> :
                                                    act.action.includes('AVATAR') ? <Camera size={16} /> :
                                                        <Activity size={16} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] text-finance-muted uppercase font-black tracking-widest mb-1">
                                                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •
                                                {new Date(act.created_at).toLocaleDateString()}
                                            </div>
                                            <div className={`text-sm font-black truncate text-finance-text`}>
                                                {act.action === 'LOGIN' || act.action === 'LOGIN_GOOGLE' ? t('login_success') || 'Inicio de Sesión' :
                                                    act.action === 'PASSWORD_CHANGE' ? t('change_password') :
                                                        act.action === 'PROFILE_UPDATE' ? t('profile_updated') :
                                                            act.action === 'AVATAR_UPLOAD' ? t('avatar_updated') :
                                                                act.action}
                                            </div>
                                            <div className="text-[10px] text-finance-muted/50 font-bold mt-0.5 truncate max-w-[180px]">
                                                {act.details}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Security Snapshot */}
                    <div className="card-elite p-8 bg-finance-pink/5 border-finance-pink/10 dark:bg-[#FF4DA6]/5 dark:border-[#FF4DA6]/10 relative overflow-hidden group">
                        <Lock size={120} className="absolute -right-8 -bottom-8 text-finance-pink/5 dark:text-[#FF4DA6]/5 group-hover:text-finance-pink/10 dark:group-hover:text-[#FF4DA6]/10 transition-colors" />
                        <h4 className="text-sm font-black text-finance-text uppercase tracking-widest mb-6 flex items-center gap-3">
                            <Lock size={18} className="text-finance-pink dark:text-[#FF4DA6]" />
                            {t('account_security')}
                        </h4>

                        <div className="space-y-5 mb-8 relative z-10">
                            <div className="p-4 bg-finance-text/5 dark:bg-black/40 rounded-2xl border border-finance-text/10 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Monitor size={16} className="text-finance-muted" />
                                    <span className="text-xs font-bold text-finance-text">{getDeviceInfo()}</span>
                                </div>
                                <span className="text-[10px] font-black text-finance-neon dark:text-[#00FFFF] border border-finance-neon/30 dark:border-[#00FFFF]/30 px-2 py-0.5 rounded-full">{t('active_now').toUpperCase()}</span>
                            </div>

                            <div className="p-4 bg-finance-text/5 dark:bg-black/20 rounded-2xl border border-finance-text/10 dark:border-white/5 flex items-center justify-between opacity-60">
                                <div className="flex items-center gap-3">
                                    <Smartphone size={16} className="text-finance-muted" />
                                    <span className="text-xs font-bold text-finance-text">Session ID: {user?.id?.slice(0, 8)}...</span>
                                </div>
                                <span className="text-[10px] font-medium text-finance-muted">2FA: OFF</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full py-4 bg-finance-text/5 dark:bg-white/5 hover:bg-finance-text/10 dark:hover:bg-white/10 border border-finance-text/10 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 relative z-10 text-finance-text"
                        >
                            <ShieldCheck size={14} className="text-finance-neon" />
                            {t('change_password')}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- PASSWORD CHANGE MODAL --- */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setShowPasswordModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="card-elite w-full max-w-md p-10 relative z-10 overflow-hidden bg-finance-800 dark:bg-[#0a0f1d] border-finance-primary/20 dark:border-white/5"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-finance-primary to-[#FF4DA6]" />
                            <h2 className="text-2xl font-black mb-2 uppercase tracking-tight text-finance-text">{t('change_password')}</h2>
                            <p className="text-finance-muted text-xs font-bold mb-8 opacity-70">{t('account_security_desc')}</p>

                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-finance-muted uppercase tracking-widest mb-1 block">
                                        {t('current_password')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            required
                                            className="input-elite w-full bg-finance-900/40 dark:bg-black/40 text-finance-text border-finance-text/10 pr-12 focus:ring-finance-primary/20"
                                            value={passwordForm.current}
                                            onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-finance-muted hover:text-finance-primary transition-colors focus:outline-none"
                                        >
                                            {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-finance-muted uppercase tracking-widest mb-1 block">
                                        {t('new_password')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            required
                                            className="input-elite w-full bg-finance-900/40 dark:bg-black/40 text-finance-text border-finance-text/10 pr-12 focus:ring-finance-primary/20"
                                            value={passwordForm.new}
                                            onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-finance-muted hover:text-finance-primary transition-colors focus:outline-none"
                                        >
                                            {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-finance-muted uppercase tracking-widest mb-1 block">
                                        {t('confirm_password')}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            required
                                            className="input-elite w-full bg-finance-900/40 dark:bg-black/40 text-finance-text border-finance-text/10 pr-12 focus:ring-finance-primary/20"
                                            value={passwordForm.confirm}
                                            onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-finance-muted hover:text-finance-primary transition-colors focus:outline-none"
                                        >
                                            {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 py-4 bg-finance-text/5 dark:bg-white/5 hover:bg-finance-text/10 dark:hover:bg-white/10 border border-finance-text/10 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-finance-text"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-[2] py-4 bg-finance-primary hover:bg-finance-primary/80 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-finance-primary/20"
                                    >
                                        {saving ? t('saving') : t('save_changes')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
