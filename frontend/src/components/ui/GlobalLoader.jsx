import React, { useState, useEffect } from "react";
import "./GlobalLoader.css";
import { useLanguage } from "../../context/LanguageContext";

const GlobalLoader = ({ fullScreen = true }) => {
    const { t } = useLanguage();
    const [drawCycle, setDrawCycle] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDrawCycle((prev) => (prev + 1) % 3);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const getTranslation = (key) => {
        return t(key);
    };

    return (
        <div
            className={`${fullScreen
                ? "fixed inset-0 z-[9999] loader-container"
                : "relative w-full h-full min-h-[400px] loader-container"
                } overflow-hidden`}
        >
            <div className="relative flex flex-col items-center justify-center scale-90 md:scale-100">
                {/* Background Ambient Glow */}
                <div className="ambient-glow" />

                <svg viewBox="0 0 120 160" className="w-64 h-72 relative z-10 filter drop-shadow-neon">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Orbital Energy Ring */}
                    <ellipse
                        cx="60" cy="135" rx="55" ry="12"
                        className="orbital-ring"
                        fill="none"
                    />

                    {/* Money Bag - Bottom Body (Plump) */}
                    <path
                        className={`loader-path bag-body animate-draw delay-${drawCycle % 3 + 1}`}
                        d="M30,55 C15,55 5,75 5,105 C5,140 30,150 60,150 C90,150 115,140 115,105 C115,75 105,55 90,55 L30,55"
                    />

                    {/* Money Bag - Top Flare (Cinched Neck) */}
                    <path
                        className={`loader-path bag-flare animate-draw delay-${(drawCycle + 1) % 3 + 1}`}
                        d="M30,55 C20,35 40,20 60,20 C80,20 100,35 90,55"
                    />

                    {/* Braided Rope Tie (Neck) */}
                    <path
                        className={`loader-path bag-rope animate-draw delay-${(drawCycle + 2) % 3 + 1}`}
                        d="M30,55 Q60,50 90,55"
                    />

                    {/* Inner Highlights for Depth */}
                    <path
                        className="loader-path"
                        style={{ stroke: 'rgba(0, 242, 255, 0.5)', strokeWidth: 1.5, filter: 'blur(1px)' }}
                        d="M20,70 Q12,105 35,135"
                    />
                    <path
                        className="loader-path"
                        style={{ stroke: 'rgba(140, 48, 245, 0.4)', strokeWidth: 1.5, filter: 'blur(1px)' }}
                        d="M100,70 Q108,105 85,135"
                    />

                    {/* Dollar Symbol (Strong Glow Core) */}
                    <g className={`loader-path dollar-sign animate-draw delay-${(drawCycle + 1) % 3 + 1}`}>
                        {/* Shadow path for depth */}
                        <path d="M62,72 L62,122 M50,87 Q74,83 74,97 Q74,111 50,111 Q50,125 74,121" stroke="rgba(0,0,0,0.15)" strokeWidth="8" fill="none" className="dark:stroke-[rgba(0,0,0,0.5)]" />
                        {/* Main Neon path */}
                        <path d="M60,70 L60,120 M48,85 Q72,81 72,95 Q72,109 48,109 Q48,123 72,119" stroke="currentColor" strokeWidth="6" fill="none" filter="url(#glow)" className="text-white dark:text-white" />
                    </g>
                </svg>

                {/* Sparkling Stars */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="spark"
                        style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${30 + Math.random() * 50}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            opacity: Math.random(),
                            transform: `scale(${0.5 + Math.random()})`
                        }}
                    />
                ))}

                <div className="mt-6 text-center">
                    <h2 className="loading-text">
                        {getTranslation()}
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default GlobalLoader;
