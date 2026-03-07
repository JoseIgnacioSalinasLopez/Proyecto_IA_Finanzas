import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { Menu, Bell } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <header className="bg-finance-800 border-b border-white/5 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 flex-shrink-0">
            <div className="flex items-center gap-3">
                {/* Botón hamburger — FUNCIONAL en móvil */}
                <button
                    className="md:hidden text-finance-muted hover:text-finance-text hover:bg-white/5 p-2 rounded-lg transition-all"
                    onClick={onMenuClick}
                    aria-label="Abrir menú de navegación"
                    title="Abrir menú"
                >
                    <Menu size={22} />
                </button>
                <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-finance-primary/10 text-finance-primary border border-finance-primary/20 hidden sm:inline-flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
                    {user?.account_type || t('account_type')}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* Notificaciones (visual, preparado para futuro) */}
                <button
                    aria-label={t('notifications')}
                    className="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-finance-muted hover:text-finance-text hover:bg-white/5 transition-all relative"
                >
                    <Bell size={18} />
                </button>

                {/* Acceso a Perfil — Interactivo */}
                <NavLink
                    to="/perfil"
                    className={({ isActive }) => `
                        flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 border border-transparent
                        ${isActive ? 'bg-finance-primary/10 border-finance-primary/20 shadow-sm' : 'hover:bg-white/5'}
                    `}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-finance-text leading-tight">{user?.name}</p>
                        <p className="text-[11px] text-finance-muted">{user?.email}</p>
                    </div>

                    {/* Avatar con inicial */}
                    <div
                        className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#00D4FF] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(0,212,255,0.3)] flex-shrink-0 cursor-pointer select-none"
                    >
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </NavLink>
            </div>
        </header>
    );
}
