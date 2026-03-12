import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function AnimatedCounter({ amount, className = '', prefix = '$', suffix = '', decimals = 2 }) {
    const { language } = useLanguage();
    const { showBalances } = useTheme();
    const count = useMotionValue(0);

    const rounded = useTransform(count, (latest) =>
        `${prefix}${latest.toLocaleString(language === 'en' ? 'en-US' : 'es-MX', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}${suffix}`
    );

    useEffect(() => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return;

        const controls = animate(count, numericAmount, {
            duration: 1.5,
            ease: "easeOut",
        });
        return controls.stop;
    }, [amount, count]);

    if (!showBalances) {
        return <span className={className}>{prefix}****</span>;
    }

    return (
        <motion.span className={className}>
            {rounded}
        </motion.span>
    );
}
