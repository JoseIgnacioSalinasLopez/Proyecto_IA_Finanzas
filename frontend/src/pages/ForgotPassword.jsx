import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import appLogo from '../assets/logo.png';
import appLogoLight from '../assets/logo claro.png';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPassword() {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setStatus(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });

            if (error) throw error;

            setStatus('success');
            setMessage(`${t('recovery_instr')} ${email}.`);
        } catch (err) {
            setStatus('error');
            setMessage(err.message || t('ai_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-fade-in-up bg-white/5">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={isLight ? appLogoLight : appLogo} alt="Mente Billete" className="h-16 w-auto object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-finance-text mb-1">{t('recovery_title')}</h1>
                    <p className="text-finance-muted text-sm">
                        {t('recovery_desc')}
                    </p>
                </div>

                {/* Mensaje de estado */}
                {status === 'success' && (
                    <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-6 animate-slide-up">
                        <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-emerald-300 text-sm font-medium">{t('recovery_email_sent')}</p>
                            <p className="text-emerald-300/70 text-xs mt-1">{message}</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 animate-slide-up">
                        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{message}</p>
                    </div>
                )}

                {/* Formulario */}
                {status !== 'success' && (
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="recovery-email" className="block text-sm font-medium text-finance-muted mb-1.5">
                                {t('email_address')}
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-finance-muted pointer-events-none" />
                                <input
                                    id="recovery-email"
                                    type="email"
                                    className="input-field pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="tu@email.com"
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full flex justify-center items-center gap-2 py-3"
                            disabled={loading || !email.trim()}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    {t('sending')}
                                </>
                            ) : (
                                t('recovery_button')
                            )}
                        </button>
                    </form>
                )}

                {/* Volver al login */}
                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-sm text-finance-muted hover:text-finance-primary transition-colors"
                    >
                        <ArrowLeft size={14} />
                        {t('back_to_login')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
