import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2 } from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';

export default function ResumenFinanciero() {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal forms states
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ amount: '', type: 'expense', category_id: '', description: '' });

    useEffect(() => {
        fetchAllData();
    }, []);

    // Un único fetch principal
    const fetchAllData = async () => {
        try {
            const [txRes, catRes, statsRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/categories'),
                api.get('/stats')
            ]);
            setTransactions(txRes.data.data);
            setCategories(catRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch parcial para actualizaciones sin recargar categorías
    const fetchTransactionsAndStats = async () => {
        try {
            const [txRes, statsRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/stats')
            ]);
            setTransactions(txRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Seguro que deseas eliminar este movimiento?')) {
            try {
                await api.delete(`/transactions/${id}`);
                fetchTransactionsAndStats();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transactions', formData);
            setShowModal(false);
            setFormData({ amount: '', type: 'expense', category_id: '', description: '' });
            fetchTransactionsAndStats();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-6 text-gray-400">Cargando resumen financiero...</div>;
    if (!stats) return <div className="p-6 text-red-500">Error cargando datos.</div>;

    const expensesData = {
        labels: stats.expensesByCategory.map(c => c.name),
        datasets: [{
            label: 'Gastos por Categoría',
            data: stats.expensesByCategory.map(c => c.amount),
            backgroundColor: stats.expensesByCategory.map(c => c.color),
            borderColor: '#161b22',
            borderWidth: 2,
        }]
    };

    const timelineData = {
        labels: stats.timeline.map(t => t.date),
        datasets: [
            {
                label: 'Ingresos',
                data: stats.timeline.map(t => t.income),
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                fill: false,
                tension: 0.3
            },
            {
                label: 'Gastos',
                data: stats.timeline.map(t => t.expense),
                backgroundColor: '#ef4444',
                borderColor: '#ef4444',
                fill: false,
                tension: 0.3
            }
        ]
    };

    return (
        <div className="bg-[#0B022D] h-full p-6 text-[#FFFFFF] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#FFFFFF]">Resumen Financiero</h1>
                    <p className="text-[#9EA3B0] mt-1">Visión general de tus finanzas</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#00D4FF] hover:opacity-80 text-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} /> Nuevo Movimiento
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Top Summary Cards */}
                <div className="col-span-12 md:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 flex flex-col justify-center">
                    <p className="text-[#9EA3B0] text-sm mb-2">Balance Neto</p>
                    <h3 className={`text-3xl font-bold ${stats.summary.balance >= 0 ? 'text-[#00D4FF]' : 'text-[#E600E6]'}`}>
                        ${stats.summary.balance.toFixed(2)}
                    </h3>
                </div>
                <div className="col-span-12 md:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 flex flex-col justify-center">
                    <p className="text-[#9EA3B0] text-sm mb-2">Ingresos Totales</p>
                    <h3 className="text-3xl font-bold text-[#FFFFFF]">
                        ${stats.summary.totalIncome.toFixed(2)}
                    </h3>
                </div>
                <div className="col-span-12 md:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 flex flex-col justify-center">
                    <p className="text-[#9EA3B0] text-sm mb-2">Gastos Totales</p>
                    <h3 className="text-3xl font-bold text-[#FFFFFF]">
                        ${stats.summary.totalExpense.toFixed(2)}
                    </h3>
                </div>

                {/* Dissection & Categories */}
                <div className="col-span-12 lg:col-span-8 bg-[#130B42] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 h-[350px]">
                    <BarChart data={timelineData} title="Ingresos vs Gastos" />
                </div>
                <div className="col-span-12 lg:col-span-4 bg-[#130B42] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 h-[350px]">
                    <PieChart data={expensesData} title="Distribución de Gastos" />
                </div>

                {/* Movimientos & Evolución */}
                <div className="col-span-12 lg:col-span-7 bg-[#130B42] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 flex flex-col h-[400px]">
                    <h3 className="text-lg font-bold text-[#FFFFFF] mb-4">Movimientos Recientes</h3>
                    <div className="overflow-x-auto flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 #0B022D' }}>
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead className="sticky top-0 bg-[#130B42] z-10">
                                <tr className="border-b border-white/10 text-[#9EA3B0]">
                                    <th className="p-3 font-medium whitespace-nowrap">Fecha</th>
                                    <th className="p-3 font-medium whitespace-nowrap">Descripción</th>
                                    <th className="p-3 font-medium whitespace-nowrap">Categoría</th>
                                    <th className="p-3 font-medium whitespace-nowrap">Monto</th>
                                    <th className="p-3 font-medium text-right whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 text-sm text-[#9EA3B0]">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-sm text-[#9EA3B0]">{tx.description}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded text-xs bg-[#0B022D] border border-white/10 text-[#9EA3B0] whitespace-nowrap">
                                                {tx.categories?.name || 'S/C'}
                                            </span>
                                        </td>
                                        <td className={`p-3 text-sm font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-[#00D4FF]' : 'text-[#FFFFFF]'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleDelete(tx.id)} className="text-[#9EA3B0] hover:text-[#E600E6] p-1 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-6 text-center text-[#9EA3B0]">No hay movimientos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 bg-[#130B42] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 h-[400px]">
                    <LineChart data={timelineData} title="Evolución" />
                </div>
            </div>

            {/* Modal para Crear Movimiento */}
            {showModal && (
                <div className="fixed inset-0 bg-[#0B022D]/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-[#130B42] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold text-[#FFFFFF] mb-6">Nuevo Movimiento</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm mb-2 text-[#9EA3B0] font-medium">Tipo</label>
                                <select
                                    className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-[#FFFFFF] focus:outline-none focus:border-[#4F46E5] transition-colors"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="expense">Gasto</option>
                                    <option value="income">Ingreso</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-2 text-[#9EA3B0] font-medium">Categoría</label>
                                <select
                                    required
                                    className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-[#FFFFFF] focus:outline-none focus:border-[#4F46E5] transition-colors"
                                    value={formData.category_id}
                                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                >
                                    <option value="" disabled>Selecciona una categoría...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-2 text-[#9EA3B0] font-medium">Monto</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-[#FFFFFF] focus:outline-none focus:border-[#4F46E5] transition-colors"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-2 text-[#9EA3B0] font-medium">Descripción</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 rounded-xl bg-[#0B022D] border border-white/10 text-[#FFFFFF] focus:outline-none focus:border-[#4F46E5] transition-colors"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl text-[#9EA3B0] hover:text-[#FFFFFF] hover:bg-white/5 transition-colors font-medium">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl font-bold hover:bg-opacity-80 transition-colors shadow-lg shadow-[#4F46E5]/20">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
