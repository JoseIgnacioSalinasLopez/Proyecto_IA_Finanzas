import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2 } from 'lucide-react';

export default function Categorias() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', color: '#00D4FF' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar esta categoría? Esto podría afectar tus movimientos.')) {
            try {
                await api.delete(`/categories/${id}`);
                fetchCategories();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', formData);
            setShowModal(false);
            setFormData({ name: '', color: '#00D4FF' });
            fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-6 text-finance-muted">Cargando categorías...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Categorías</h1>
                    <p className="text-finance-muted">Clasifica tus gastos e ingresos</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Nueva
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="card flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <span className="font-medium text-finance-text">{cat.name}</span>
                        </div>
                        <button onClick={() => handleDelete(cat.id)} className="text-finance-muted hover:text-finance-danger">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                {categories.length === 0 && (
                    <div className="col-span-full text-center p-6 text-finance-muted border-2 border-dashed border-finance-700 rounded-xl">
                        No tienes categorías personalizadas.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-finance-800 p-6 rounded-xl w-full max-w-sm border border-finance-700">
                        <h2 className="text-xl font-bold mb-4">Nueva Categoría</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 text-finance-muted">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-finance-muted">Color (Hex)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="h-10 w-10 p-1 bg-finance-900 border border-finance-700 rounded cursor-pointer"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        required
                                        className="input-field flex-1"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-finance-muted">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
