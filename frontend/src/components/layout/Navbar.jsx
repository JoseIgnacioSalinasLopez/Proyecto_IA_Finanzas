import { useAuth } from '../../hooks/useAuth';
import { Menu } from 'lucide-react';

export default function Navbar() {
    const { user } = useAuth();

    return (
        <header className="bg-finance-800 border-b border-finance-700 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-finance-muted hover:text-finance-text">
                    <Menu size={24} />
                </button>
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-finance-primary/10 text-finance-primary">
                    Cuenta: {user?.account_type || 'Básica'}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-finance-text">{user?.name}</p>
                    <p className="text-xs text-finance-muted">{user?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-finance-700 flex items-center justify-center text-finance-primary font-bold text-lg border-2 border-finance-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>
    );
}
