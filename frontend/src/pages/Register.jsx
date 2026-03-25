import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import appLogo from '../assets/lanatrix.png';
import appLogoLight from '../assets/lanatrix claro.png';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { registerUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await registerUser(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || t('registration_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-white/5">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={isLight ? appLogoLight : appLogo} alt="LanaTrix Logo" className="h-20 w-auto object-contain" />
                    </div>
                    <p className="text-finance-muted mt-4">{t('register_title')}</p>
                </div>

                {error && (
                    <div className="bg-finance-danger/10 border border-finance-danger text-finance-danger px-4 py-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">{t('full_name')}</label>
                        <input
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">{t('email_address')}</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">{t('change_password')}</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input-field w-full pr-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-finance-muted hover:text-white transition-colors"
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full flex justify-center py-3 mt-4"
                        disabled={loading}
                    >
                        {loading ? t('creating_account') : t('register_button')}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-finance-muted">
                    {t('have_account')}{' '}
                    <Link to="/login" className="text-finance-primary hover:text-finance-primaryHover font-medium">
                        {t('login_here')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
