import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PieChart, Tags, User, Bot, LogOut, Target, X, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import appLogo from '../../assets/logo.png';

export default function Sidebar({ isOpen, onClose }) {
    const { pathname } = useLocation();
    const { logout } = useAuth();

    const { t } = useLanguage();

    const navLinks = [
        { name: t('dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
        { name: t('finances'), path: '/resumen', icon: <PieChart size={20} /> },
        { name: t('categories'), path: '/categorias', icon: <Tags size={20} /> },
        { name: t('goals'), path: '/metas', icon: <Target size={20} /> },
        { name: t('ai_assistant'), path: '/chatia', icon: <Bot size={20} /> },
        { name: t('settings'), path: '/configuracion', icon: <Settings size={20} /> },
    ];

    const handleLinkClick = () => {
        if (onClose) onClose(); // Cierra sidebar en móvil al navegar
    };

    return (
        <>
            {/* Sidebar — visible siempre en desktop, drawer en móvil */}
            <aside
                className={`
                    bg-finance-800 border-r border-white/5 h-screen flex flex-col flex-shrink-0
                    fixed md:sticky top-0 z-40
                    transition-all duration-300 ease-in-out group
                    ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 w-20 hover:md:w-64'}
                `}
                aria-label="Navegación principal"
            >
                {/* Header del Sidebar */}
                <div className="p-5 h-20 flex items-center justify-between border-b border-white/5 overflow-hidden">
                    <Link to="/" onClick={handleLinkClick} className="flex items-center min-w-max">
                        <img
                            src={appLogo}
                            alt="Mente Billete"
                            className={`h-10 w-auto object-contain transition-all duration-300 ${isOpen ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'}`}
                        />
                        {!isOpen && (
                            <div className="absolute left-6 h-8 w-8 bg-finance-primary/20 rounded-lg flex items-center justify-center text-finance-primary md:group-hover:opacity-0 transition-opacity duration-200">
                                <span className="font-bold text-lg">$</span>
                            </div>
                        )}
                    </Link>
                    {/* Botón cerrar — solo visible en móvil */}
                    <button
                        onClick={onClose}
                        className="md:hidden text-finance-muted hover:text-finance-text p-1.5 rounded-lg hover:bg-white/5 transition-all"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navegación */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path));
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={handleLinkClick}
                                aria-current={isActive ? 'page' : undefined}
                                title={!isOpen ? link.name : ""}
                                className={`
                                    flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-finance-primary/10 text-finance-primary font-semibold shadow-[0_0_0_1px_rgba(0,212,255,0.1)]'
                                        : 'text-finance-muted hover:bg-white/5 hover:text-finance-text font-medium'
                                    }
                                `}
                            >
                                <div className={`flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                                    {link.icon}
                                </div>
                                <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0 md:group-hover:opacity-100 md:group-hover:w-auto'}`}>
                                    {link.name}
                                </span>
                                {isActive && (
                                    <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-finance-primary transition-opacity ${isOpen ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'}`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer — Cerrar sesión */}
                <div className="p-3 border-t border-white/5">
                    <button
                        onClick={logout}
                        title={!isOpen ? t('logout') : ""}
                        className="flex items-center gap-4 px-4 py-3 w-full text-left text-finance-muted hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 font-medium whitespace-nowrap overflow-hidden"
                        aria-label={t('logout')}
                    >
                        <div className="flex-shrink-0">
                            <LogOut size={20} />
                        </div>
                        <span className={`transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0 md:group-hover:opacity-100 md:group-hover:w-auto'}`}>
                            {t('logout')}
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
