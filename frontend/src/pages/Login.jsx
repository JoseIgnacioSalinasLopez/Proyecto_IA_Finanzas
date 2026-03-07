import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import appLogo from '../assets/logo.png';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || t('error_loading'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-finance-900 p-4">
            <div className="card w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={appLogo} alt="Mente Billete Logo" className="h-20 w-auto object-contain" />
                    </div>
                    <p className="text-finance-muted mt-4">{t('login_title')}</p>
                </div>

                {error && (
                    <div className="bg-finance-danger/10 border border-finance-danger text-finance-danger px-4 py-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex justify-end text-sm">
                        <Link to="/forgot-password" className="text-finance-primary hover:text-finance-primaryHover">
                            {t('forgot_password_q')}
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full flex justify-center py-3"
                        disabled={loading}
                    >
                        {loading ? t('logging_in') : t('login_button')}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-finance-muted">
                    {t('no_account')}{' '}
                    <Link to="/register" className="text-finance-primary hover:text-finance-primaryHover font-medium">
                        {t('register_here')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
