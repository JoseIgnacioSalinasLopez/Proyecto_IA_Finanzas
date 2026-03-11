import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Plus, BarChart3, Bot } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function BottomNav() {
    const { t } = useLanguage();

    const navLinks = [
        { name: t('dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
        { name: t('finances'), path: '/resumen', icon: <Wallet size={20} /> },
    ];

    const rightLinks = [
        { name: t('reports'), path: '/reportes', icon: <BarChart3 size={20} /> },
        { name: t('ai_assistant'), path: '/chatia', icon: <Bot size={20} /> },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-finance-900/80 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.3)] backdrop-saturate-150">
            <div className="flex justify-around items-center h-16 px-2 relative">
                {/* Left Links */}
                {navLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300
                            ${isActive ? 'text-finance-primary' : 'text-finance-muted hover:text-finance-text'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]' : ''}`}>
                                    {link.icon}
                                </div>
                                <span className={`text-[9px] font-bold tracking-wider uppercase transition-all duration-300 ${isActive ? 'opacity-100 font-black' : 'opacity-70'}`}>
                                    {link.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Center Quick Add Button */}
                <div className="relative -top-5 flex justify-center w-full">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
                        className="btn-epic w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,212,255,0.4)] transform hover:scale-105 transition-all duration-300"
                        aria-label="Añadir Rápido"
                    >
                        <Plus size={24} strokeWidth={3} className="text-[#00D4FF]" />
                    </button>
                </div>

                {/* Right Links */}
                {rightLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300
                            ${isActive ? 'text-finance-primary' : 'text-finance-muted hover:text-finance-text'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]' : ''}`}>
                                    {link.icon}
                                </div>
                                <span className={`text-[9px] font-bold tracking-wider uppercase transition-all duration-300 ${isActive ? 'opacity-100 font-black' : 'opacity-70'}`}>
                                    {link.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
