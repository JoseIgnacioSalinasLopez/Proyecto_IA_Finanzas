import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Save } from 'lucide-react';
import Toast from '../components/ui/Toast';

export default function Perfil() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            showToast(t('passwords_dont_match'), 'error');
            return;
        }
        if (formData.password && formData.password.length < 6) {
            showToast(language === 'en' ? 'Password must be at least 6 characters.' : 'La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = { name: formData.name, email: formData.email };
            if (formData.password) payload.password = formData.password;

            await api.put('/profile', payload);
            showToast(t('profile_updated'));
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error) {
            showToast(error.response?.data?.message || t('profile_error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div>
                <h1 className="text-2xl font-bold mb-1">{t('profile')}</h1>
                <p className="text-finance-muted">{t('manage_info')}</p>
            </div>

            <div className="card">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#00D4FF] flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user?.name}</h2>
                        <p className="text-finance-muted text-sm">
                            {t('member_since')} {new Date(user?.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX', { year: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">{t('full_name')}</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">{t('email_address')}</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    {/* Cambiar contraseña */}
                    <div className="pt-4 border-t border-finance-700">
                        <h3 className="font-semibold mb-4 text-finance-text">{t('change_password')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-finance-muted mb-1">{t('new_password')}</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        className="input-field pr-10"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={t('password_min')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-finance-muted hover:text-finance-text"
                                    >
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-finance-muted mb-1">{t('confirm_password')}</label>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className={`input-field ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : ''}`}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder={t('password_repeat')}
                                />
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-red-400 mt-1">{t('passwords_dont_match')}</p>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-finance-muted mt-2">
                            {t('password_help')}
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2 px-8"
                            disabled={loading}
                        >
                            <Save size={16} />
                            {loading ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
