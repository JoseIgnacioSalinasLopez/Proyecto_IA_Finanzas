import React from "react";
import "./GlobalLoader.css";

const GlobalLoader = ({ fullScreen = true }) => {
    return (
        <div
            className={`${fullScreen
                    ? "fixed inset-0 z-[9999] bg-finance-900/80 backdrop-blur-sm"
                    : "relative w-full h-full min-h-[200px]"
                } flex flex-col items-center justify-center`}
        >
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Glow de fondo */}
                <div className="absolute inset-0 bg-finance-primary/20 blur-2xl rounded-full scale-110 animate-pulse-slow"></div>

                {/* SVG Animado */}
                <svg
                    viewBox="0 0 100 100"
                    className="w-24 h-24 stroke-loader z-10 drop-shadow-[0_0_15px_rgba(0,212,255,0.6)]"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                >
                    {/* Contorno de la Bolsa */}
                    <path
                        className="loader-path path-bag"
                        d="M 35 30 
               C 30 50, 20 60, 20 80 
               C 20 95, 80 95, 80 80 
               C 80 60, 70 50, 65 30 
               Z"
                    />

                    {/* Pliegues del cuello */}
                    <path
                        className="loader-path path-neck"
                        d="M 38 28 
               C 35 15, 30 10, 30 10
               M 62 28 
               C 65 15, 70 10, 70 10
               M 45 30 L 40 10
               M 55 30 L 60 10"
                    />

                    {/* Cuerda / Nudo */}
                    <path
                        className="loader-path path-tie"
                        d="M 28 30 C 50 35, 72 30, 72 30"
                    />

                    {/* Símbolo de Dólar ($) */}
                    <path
                        className="loader-path path-dollar"
                        d="M 50 40 L 50 85 
               M 60 48 
               C 60 40, 40 40, 40 50 
               C 40 60, 60 62, 60 72 
               C 60 82, 40 82, 40 75"
                    />
                </svg>

                {/* Partículas orbitales */}
                <div className="absolute inset-0 w-full h-full animate-spin-slow">
                    <div className="w-2 h-2 rounded-full border border-finance-primary bg-finance-primary/50 shadow-[0_0_8px_rgba(0,212,255,1)] absolute top-0 left-1/2 -translate-x-1/2" />
                </div>
            </div>
            <p className="mt-6 text-sm font-bold text-finance-neon tracking-widest uppercase animate-pulse drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">
                Sincronizando...
            </p>
        </div>
    );
};

export default GlobalLoader;
