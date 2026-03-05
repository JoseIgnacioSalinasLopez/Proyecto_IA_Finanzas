import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function Perfil() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        account_type: user?.account_type || 'standard'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            // If password is empty, don't send it
            const payload = { ...formData };
            if (!payload.password) delete payload.password;

            await api.put('/profile', payload);
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente. (Recarga la página para ver cambios si modificaste tu nombre)' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error al actualizar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold mb-1">Mi Perfil</h1>
                <p className="text-finance-muted">Gestiona tu información personal</p>
            </div>

            <div className="card">
                {message.text && (
                    <div className={`px-4 py-3 rounded mb-6 text-sm ${message.type === 'success' ? 'bg-finance-primary/10 border border-finance-primary text-finance-primary' : 'bg-finance-danger/10 border border-finance-danger text-finance-danger'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-finance-700 flex items-center justify-center text-finance-primary font-bold text-2xl border-4 border-finance-800 ring-2 ring-finance-primary/50">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user?.name}</h2>
                        <p className="text-finance-muted">Miembro desde {new Date(user?.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-finance-muted mb-1">Tipo de Cuenta</label>
                        <select
                            className="input-field"
                            value={formData.account_type}
                            onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                        >
                            <option value="standard">Estándar</option>
                            <option value="premium">Premium</option>
                        </select>
                        <p className="text-xs text-finance-muted mt-1">Este selector es solo demostrativo de la funcionalidad de actualización.</p>
                    </div>

                    <div className="pt-4 border-t border-finance-700">
                        <h3 className="font-medium mb-4 text-finance-text">Cambiar Contraseña</h3>
                        <label className="block text-sm font-medium text-finance-muted mb-1">Nueva Contraseña (opcional)</label>
                        <input
                            type="password"
                            className="input-field"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Deja en blanco para no cambiar"
                            minLength={6}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="btn-primary px-8"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
