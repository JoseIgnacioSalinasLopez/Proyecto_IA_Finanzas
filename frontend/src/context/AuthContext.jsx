import { useState, useEffect, useContext, createContext, useRef } from 'react';
import api from '../services/api';
import { supabase } from '../lib/supabase';
import { useLanguage } from './LanguageContext';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const { t } = useLanguage();
    const syncLockRef = useRef(false);

    useEffect(() => {
        const syncGoogleUser = async (session) => {
            if (!session || syncLockRef.current) return;

            syncLockRef.current = true;
            try {
                const { user: supaUser } = session;
                const { data } = await api.post('/auth/google', {
                    email: supaUser.email,
                    name: supaUser.user_metadata?.full_name || supaUser.email.split('@')[0]
                });

                if (data.success) {
                    localStorage.setItem('token', data.data.token);
                    setUser(data.data);
                    toast.success(t('welcome_back') || '¡Bienvenido de nuevo!');
                }
            } catch (error) {
                console.error('[Auth] Error syncing Google auth:', error);
                toast.error(t('login_error') || 'Error al entrar con Google');
            } finally {
                syncLockRef.current = false;
            }
        };

        const initAuth = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const { data } = await api.get('/auth/me');
                        setUser(data.data);
                        setLoading(false);
                        return;
                    } catch (e) {
                        localStorage.removeItem('token');
                    }
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await syncGoogleUser(session);
                }
            } catch (error) {
                console.error('[Auth] Error durante inicialización:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                if (!localStorage.getItem('token')) {
                    syncGoogleUser(session);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('token');
            }
        });

        // Listen for auth errors thrown by Axios interceptor
        const handleAuthError = () => {
            setUser(null);
            localStorage.removeItem('token');
        };
        window.addEventListener('auth-error', handleAuthError);

        return () => {
            window.removeEventListener('auth-error', handleAuthError);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.data.token);
        setUser(data.data);
    };

    const registerUser = async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('token', data.data.token);
        setUser(data.data);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        setUser(null);
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    };

    const refreshUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data.data);
        } catch (error) {
            console.error('[Auth] Error refreshing user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, registerUser, loginWithGoogle, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    return useContext(AuthContext);
};
