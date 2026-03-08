import { useState, useEffect } from 'react';

export default function CursorFollower() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };
        checkMobile();
        
        const onMouseMove = (e) => {
            if (isMobile) return;
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', checkMobile);
        };
    }, [isMobile]);

    if (isMobile) return null;

    return (
        <div 
            className="fixed pointer-events-none z-[9999] transition-transform duration-100 ease-out"
            style={{ 
                left: position.x, 
                top: position.y,
                transform: 'translate(-50%, -50%)' 
            }}
        >
            <div className="w-6 h-6 border border-finance-primary/50 rounded-full animate-ping absolute -inset-2" />
            <div className="w-1.5 h-1.5 bg-finance-primary rounded-full shadow-[0_0_10px_#00d4ff]" />
            <div className="w-32 h-32 bg-finance-primary/5 rounded-full blur-3xl absolute -translate-x-1/2 -translate-y-1/2" />
        </div>
    );
}
