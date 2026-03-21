import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const ParticleBackground = ({ count = 30 }) => {
    // Generar partículas con valores base aleatorios consistentes en cada renderizado
    // para evitar hidrataciones o re-renders locos.
    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            size: Math.random() * 3 + 1, // Tamaño entre 1 y 4px
            startX: Math.random() * 100, // X Inicial (%)
            startY: Math.random() * 100, // Y Inicial (%)
            duration: Math.random() * 20 + 15, // Velocidad de flotación (15s a 35s)
            delay: Math.random() * -20, // Desfase inicial para que ya estén en movimiento
            colorType: Math.random() > 0.5 ? 'cyan' : 'purple'
        }));
    }, [count]);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className={`absolute rounded-full ${p.colorType === 'cyan' ? 'bg-[#00FFFF] shadow-[0_0_12px_#00FFFF]' : 'bg-[#FF4DA6] shadow-[0_0_12px_#FF4DA6]'}`}
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.startX}%`,
                        top: `${p.startY}%`,
                    }}
                    animate={{
                        y: [0, -window.innerHeight * 1.5],
                        x: [0, (Math.random() - 0.5) * 500],
                        opacity: [0, 0.6, 0.6, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: p.delay
                    }}
                />
            ))}
        </div>
    );
};

export default ParticleBackground;
