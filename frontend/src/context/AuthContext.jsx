import { useState, useEffect, useContext, createContext } from 'react';
import api from '../services/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const { data } = await api.get('/auth/me');
                    setUser(data.data);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };


        fetchUser();

        // Listener for Supabase Auth (Google Login)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                try {
                    const { user: supaUser } = session;
                    const { data } = await api.post('/auth/google', {
                        email: supaUser.email,
                        name: supaUser.user_metadata?.full_name || supaUser.email.split('@')[0]
                    });
                    localStorage.setItem('token', data.data.token);
                    setUser(data.data);
                    // Importante: Limpiar la sesión de Supabase después de obtener nuestro propio token
                    // para que el listener no se dispare en bucle si recargamos.
                    // O simplemente confiar en que el estado de setUser detendrá el bucle.
                } catch (error) {
                    console.error('Error syncing Google auth:', error);
                }
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

    return (
        <AuthContext.Provider value={{ user, login, registerUser, loginWithGoogle, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    return useContext(AuthContext);
};
