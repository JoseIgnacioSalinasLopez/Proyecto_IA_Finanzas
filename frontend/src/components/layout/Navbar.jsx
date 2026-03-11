import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { Menu, Bell } from 'lucide-react';
import NotificationsDropdown from '../ui/NotificationsDropdown';
import { supabase } from '../../lib/supabase';
import api from '../../services/api';


export default function Navbar({ onMenuClick }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        fetchNotifications();

        // Escuchar recargas globales
        window.addEventListener('refresh-data', fetchNotifications);

        const subscription = supabase
            .channel('any')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
            window.removeEventListener('refresh-data', fetchNotifications);
        };
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                const newNotifs = res.data.data || [];

                // Read the last seen date from localStorage
                const lastSeenStr = localStorage.getItem(`lastSeenNotifs_${user.id}`);
                const lastSeenDate = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;

                // A notification is unseen if its created_at is strictly newer than our last seen date
                const hasNew = newNotifs.some(n => new Date(n.created_at).getTime() > lastSeenDate);

                setHasUnseenNotifications(hasNew);
                setNotifications(newNotifs);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Apagar el punto y guardar la última fecha vista cuando se abre el menú
    useEffect(() => {
        if (showNotifs && user?.id) {
            setHasUnseenNotifications(false);
            if (notifications.length > 0) {
                const latestDate = Math.max(...notifications.map(n => new Date(n.created_at).getTime()));
                localStorage.setItem(`lastSeenNotifs_${user.id}`, new Date(latestDate).toISOString());
            }
        }
    }, [showNotifs, notifications, user?.id]);

    const handleClearNotifs = async () => {
        try {
            const res = await api.put('/notifications/mark-read');
            if (res.data.success) {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    return (
        <header className="bg-finance-900/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 flex-shrink-0">
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
                <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-finance-primary/10 text-finance-primary border border-finance-primary/20 hidden sm:inline-flex items-center gap-1.5 uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-finance-primary shadow-[0_0_8px_rgba(0,212,255,0.6)] animate-pulse" />
                    {user?.account_type || t('account_type')}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* Notificaciones - Contenedor Aislado */}
                <div className="relative">
                    <button
                        aria-label={t('notifications')}
                        onClick={() => setShowNotifs(!showNotifs)}
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all relative group cursor-pointer ${showNotifs ? 'bg-finance-primary/10 text-finance-primary' : 'text-finance-muted hover:text-finance-text hover:bg-white/5'}`}
                    >
                        <Bell size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                        {hasUnseenNotifications && notifications.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-finance-primary rounded-full shadow-[0_0_8px_#00D4FF] cursor-pointer" />
                        )}
                    </button>


                    {showNotifs && (
                        <NotificationsDropdown
                            notifications={notifications}
                            onClose={() => setShowNotifs(false)}
                            onClear={handleClearNotifs}
                        />
                    )}
                </div>

                {/* Acceso a Perfil — Interactivo */}
                <NavLink
                    to="/perfil"
                    className={({ isActive }) => `
                        flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all duration-300 border border-transparent
                        ${isActive ? 'bg-white/5 border-white/10 shadow-lg' : 'hover:bg-white/5'}
                    `}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-finance-text leading-tight tracking-tight">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
                    </div>

                    {/* Avatar con inicial Elite */}
                    <div
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8C30F5] to-[#00D4FF] flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(0,212,255,0.4)] flex-shrink-0 cursor-pointer select-none ring-2 ring-white/10"
                    >
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </NavLink>
            </div>
        </header>
    );
}
