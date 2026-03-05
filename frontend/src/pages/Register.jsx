import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import appLogo from '../assets/logo.png';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
            setError(err.response?.data?.message || 'Error al registrarte');
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
                    <p className="text-finance-muted mt-4">Crea una cuenta nueva</p>
                </div>

                {error && (
                    <div className="bg-finance-danger/10 border border-finance-danger text-finance-danger px-4 py-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">Nombre Completo</label>
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
                        <label className="block text-sm font-medium text-finance-muted mb-1">Correo Electrónico</label>
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
                        <label className="block text-sm font-medium text-finance-muted mb-1">Contraseña</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full flex justify-center py-3 mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Creando cuenta...' : 'Regístrate'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-finance-muted">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="text-finance-primary hover:text-finance-primaryHover font-medium">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}
