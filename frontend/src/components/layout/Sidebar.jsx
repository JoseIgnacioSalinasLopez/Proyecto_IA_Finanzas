import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Tags, User, Bot, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import appLogo from '../../assets/logo.png';

export default function Sidebar() {
    const { pathname } = useLocation();
    const { logout } = useAuth();

    const navLinks = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Resumen', path: '/resumen', icon: <PieChart size={20} /> },
        { name: 'Categorías', path: '/categorias', icon: <Tags size={20} /> },
        { name: 'ChatIA', path: '/chatia', icon: <Bot size={20} /> },
        { name: 'Perfil', path: '/perfil', icon: <User size={20} /> },
    ];

    return (
        <aside className="w-64 bg-finance-800 border-r border-finance-700 h-screen sticky top-0 flex flex-col hidden md:flex">
            <div className="p-6">
                <h1 className="flex justify-center mb-6 mt-2">
                    <img src={appLogo} alt="Mente Billete Logo" className="h-10 w-auto object-contain" />
                </h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {navLinks.map((link) => {
                    const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-finance-primary/10 text-finance-primary'
                                : 'text-finance-muted hover:bg-finance-700 hover:text-finance-text'
                                }`}
                        >
                            {link.icon}
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-finance-700">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-finance-muted hover:bg-finance-danger/10 hover:text-finance-danger rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
