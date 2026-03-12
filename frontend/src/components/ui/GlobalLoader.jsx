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

                {/* SVG Animado - Bolsa de dinero */}
                <svg
                    viewBox="0 0 100 122"
                    className="w-24 h-28 stroke-loader z-10 drop-shadow-[0_0_15px_rgba(0,212,255,0.6)]"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                >
                    {/* Nudo redondo en la parte superior */}
                    <circle
                        className="loader-path path-tie"
                        cx="50" cy="16" r="9"
                    />

                    {/* Cuello estrecho que baja del nudo */}
                    <path
                        className="loader-path path-neck"
                        d="M 42 24 C 40 30, 37 33, 33 40 M 58 24 C 60 30, 63 33, 67 40"
                    />

                    {/* Cuerpo grande y ovalado de la bolsa */}
                    <path
                        className="loader-path path-bag"
                        d="M 33 40 C 8 40, 6 60, 6 76 C 6 98, 25 114, 50 114 C 75 114, 94 98, 94 76 C 94 60, 92 40, 67 40 Z"
                    />

                    {/* Símbolo de Dólar ($) dentro del cuerpo */}
                    <path
                        className="loader-path path-dollar"
                        d="M 50 52 L 50 100
               M 63 63 C 63 53, 37 53, 37 67 C 37 81, 63 83, 63 97 C 63 109, 37 109, 37 99"
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
