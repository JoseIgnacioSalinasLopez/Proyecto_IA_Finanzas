import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, BarChart3, Tags, User, Bot, LogOut, Target, X, Settings, Plus, Calculator } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import appLogo from '../../assets/lanatrix.png';
import appLogoLight from '../../assets/lanatrix claro.png';
import bolsaIcon from '../../assets/bolsa.png';
import bolsaIconLight from '../../assets/bolsa claro.png';

export default function Sidebar({ isOpen, onClose }) {
    const { pathname } = useLocation();
    const { logout } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const navLinks = [
        { name: t('dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
        { name: t('finances'), path: '/resumen', icon: <Wallet size={20} /> },
        { name: t('reports'), path: '/reportes', icon: <BarChart3 size={20} /> },
        { name: t('budgets'), path: '/presupuestos', icon: <Calculator size={20} /> },
        { name: t('categories'), path: '/categorias', icon: <Tags size={20} /> },
        { name: t('goals'), path: '/metas', icon: <Target size={20} /> },
        { name: t('ai_assistant'), path: '/chatia', icon: <Bot size={20} /> },
        { name: t('settings'), path: '/configuracion', icon: <Settings size={20} /> },
    ];

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <>
            <aside
                className={`
                    bg-finance-900/60 backdrop-blur-2xl border-r border-white/10 h-screen flex flex-col flex-shrink-0
                    fixed md:sticky top-0 z-40 backdrop-saturate-150 shadow-[4px_0_24px_rgba(0,0,0,0.3)]
                    transition-all duration-500 ease-in-out group
                    ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 w-20 md:hover:w-64'}
                `}
                aria-label={t('main_navigation')}
            >
                {/* Header - Solo Logo/Bolsa */}
                <div className="p-0 h-24 flex items-center border-b border-white/10 overflow-hidden bg-white/5 backdrop-blur-md">
                    <Link to="/" onClick={handleLinkClick} className="flex items-center w-full h-full relative">
                        {/* Contenedor para la Bolsa (siempre centrado en los primeros 80px) */}
                        <div className="w-20 h-full flex-shrink-0 flex items-center justify-center relative z-10">
                            <img
                                src={isLight ? bolsaIconLight : bolsaIcon}
                                alt="Bolsa"
                                className={`h-11 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_12px_var(--epic-cyan)] ${isOpen ? 'opacity-0 scale-50' : 'opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-50'}`}
                            />
                        </div>

                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-110'}`}>
                            <img
                                src={isLight ? appLogoLight : appLogo}
                                alt="Logo"
                                className="h-14 w-auto object-contain drop-shadow-[0_0_18px_var(--epic-cyan)]"
                            />
                        </div>
                    </Link>
                    <button onClick={onClose} className="md:hidden absolute right-4 text-finance-muted p-2 hover:bg-white/5 rounded-lg z-20"><X size={20} /></button>
                </div>

                {/* Quick Add Button - Centrado Absoluto */}
                {pathname !== '/chatia' && (
                    <div className="py-6 flex justify-start w-full overflow-hidden">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
                            className={`
                                flex items-center btn-epic transition-all duration-300 overflow-hidden relative mx-0
                                ${isOpen ? 'w-[calc(100%-2rem)] h-12 rounded-xl px-4 ml-4 gap-4' : 'w-12 h-12 justify-center rounded-full ml-4 md:group-hover:w-[calc(100%-2rem)] md:group-hover:px-4 md:group-hover:gap-4 md:group-hover:rounded-xl'}
                            `}
                        >
                            <div className="flex-shrink-0 flex items-center justify-center">
                                <Plus size={20} strokeWidth={3} />
                            </div>
                            <span className={`whitespace-nowrap transition-all duration-300 font-black tracking-widest text-[10px] ${isOpen ? 'opacity-100' : 'opacity-0 w-0 md:group-hover:opacity-100 md:group-hover:w-auto'}`}>
                                {t('quick_registration').toUpperCase()}
                            </span>
                        </button>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path));
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={handleLinkClick}
                                className={`
                                    flex items-center min-h-[50px] transition-all duration-300 mx-2 rounded-xl relative
                                    ${isActive ? 'bg-gradient-to-r from-[#00FFFF]/30 to-[#8C30F5]/10 text-[#00FFFF] font-black border border-[#00FFFF]/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all' : 'text-finance-muted hover:bg-white/10 hover:text-finance-text'}
                                `}
                            >
                                <div className="w-[64px] flex-shrink-0 flex items-center justify-center h-full">
                                    <div className={isActive ? 'drop-shadow-[0_0_10px_var(--epic-cyan)] scale-110' : 'group-hover:scale-110'}>
                                        {link.icon}
                                    </div>
                                </div>
                                <span className={`whitespace-nowrap tracking-widest text-xs uppercase transition-all duration-300 ${isOpen ? 'opacity-100 ml-0' : 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto group-hover:ml-0'}`}>
                                    {link.name}
                                </span>
                                {isActive && (
                                    <div className={`ml-auto mr-4 w-1.5 h-1.5 rounded-full bg-finance-primary shadow-[0_0_12px_var(--epic-cyan)] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-2 border-t border-white/10 overflow-hidden bg-white/5 backdrop-blur-md">
                    <button
                        onClick={logout}
                        className={`
                            flex items-center w-full min-h-[50px] text-finance-muted hover:bg-[#FF4DA6]/10 hover:text-[#FF4DA6] rounded-xl transition-all duration-200 overflow-hidden group/logout
                            ${isOpen ? 'px-0' : 'px-0 justify-start'}
                        `}
                    >
                        <div className="w-[64px] flex-shrink-0 flex items-center justify-center group-hover/logout:scale-110 transition-transform">
                            <LogOut size={20} />
                        </div>
                        <span className={`whitespace-nowrap font-bold tracking-widest text-xs uppercase transition-all duration-300 ${isOpen ? 'opacity-100 ml-0' : 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto md:group-hover:ml-0'}`}>
                            {t('logout')}
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
