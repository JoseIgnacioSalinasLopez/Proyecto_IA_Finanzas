import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    const [showBalances, setShowBalances] = useState(() => {
        return localStorage.getItem('showBalances') !== 'false';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light-mode');
        } else {
            root.classList.remove('dark');
            root.classList.add('light-mode');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('showBalances', showBalances);
    }, [showBalances]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const toggleBalances = () => {
        setShowBalances((prev) => !prev);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, showBalances, toggleBalances }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
