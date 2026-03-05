import { useState, useEffect } from 'react';
import api from '../services/api';
import SummaryCard from '../components/ui/SummaryCard';
import { ArrowDownRight, ArrowUpRight, Wallet, Bot, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import iaLogo from '../assets/Imagen pegada.png';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, transRes] = await Promise.all([
                    api.get('/stats'),
                    api.get('/transactions')
                ]);
                setStats(statsRes.data.data);

                // Ordenar por fecha más reciente (descendente) y tomar los 5 primeros
                const sortedTx = transRes.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setRecentTransactions(sortedTx.slice(0, 5));
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="flex bg-finance-900 justify-center min-h-[50vh] items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-finance-primary"></div></div>;
    }

    const { summary } = stats || { summary: { totalIncome: 0, totalExpense: 0, balance: 0 } };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-1">Resumen Financiero</h1>
                <p className="text-finance-muted">Un vistazo a tu estado actual</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title="Balance Total"
                    amount={summary.balance}
                    icon={<Wallet size={24} />}
                    type="balance"
                />
                <SummaryCard
                    title="Ingresos del Mes"
                    amount={summary.totalIncome}
                    icon={<ArrowUpRight size={24} />}
                    type="income"
                />
                <SummaryCard
                    title="Gastos del Mes"
                    amount={summary.totalExpense}
                    icon={<ArrowDownRight size={24} />}
                    type="expense"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Widget */}
                <div className="card relative overflow-hidden group min-h-[300px] flex flex-col justify-between border-[#8C30F5]/30 hover:border-[#00D4FF]/50 transition-colors">
                    {/* Glowing Aura Background */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#E600E6]/20 to-[#00D4FF]/20 rounded-full blur-3xl group-hover:bg-gradient-to-br group-hover:from-[#E600E6]/30 group-hover:to-[#00D4FF]/30 transition-all duration-500"></div>
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-gradient-to-tr from-[#8C30F5]/20 to-[#00FFFF]/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)] overflow-hidden p-0.5">
                                <img src={iaLogo} alt="IA Logo" className="w-full h-full object-cover rounded-[14px]" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-1 rounded-full border border-[#00D4FF]/20">
                                <Sparkles size={12} /> IA Beta
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Tu Asistente<br />Financiero</h2>
                        <p className="text-finance-muted text-sm leading-relaxed max-w-[200px]">
                            Consúltale sobre tus ingresos mensuales, balances, e historial con simples comandos de texto.
                        </p>
                    </div>

                    <Link to="/chatia" className="relative z-10 mt-6 md:mt-0 flex items-center justify-between w-full bg-finance-900/80 hover:bg-[#130B42] border border-finance-700 group-hover:border-[#8C30F5]/50 px-4 py-3 rounded-xl transition-all">
                        <span className="font-semibold text-white/90 group-hover:text-white transition-colors">Hablar con ChatIA</span>
                        <div className="w-8 h-8 rounded-full bg-finance-800 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#E600E6] group-hover:to-[#00D4FF] group-hover:shadow-[0_0_10px_rgba(230,0,230,0.5)] transition-all">
                            <ArrowUpRight size={18} className="text-finance-muted group-hover:text-white transition-colors" />
                        </div>
                    </Link>
                </div>

                {/* Recent Transactions */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">Movimientos Recientes</h2>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <p className="text-finance-muted text-center py-4">No hay movimientos aún.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentTransactions.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 bg-finance-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-finance-primary/10 text-finance-primary' : 'bg-finance-danger/10 text-finance-danger'}`}>
                                            {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{tx.description || tx.categories?.name || 'Sin nombre'}</p>
                                            <p className="text-xs text-finance-muted">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-semibold ${tx.type === 'income' ? 'text-finance-primary' : 'text-finance-text'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
