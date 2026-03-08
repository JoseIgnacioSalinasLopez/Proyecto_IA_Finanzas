import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function DatePickerElite({ value, onChange, label, id }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Parse current value
    const parsed = value ? new Date(value + 'T12:00:00') : new Date();
    const [viewYear, setViewYear] = useState(parsed.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed.getMonth());

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handleSelectDay = (day) => {
        const month = String(viewMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        onChange(`${viewYear}-${month}-${dayStr}`);
        setOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    const selectedDay = value ? parseInt(value.split('-')[2]) : null;
    const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null;
    const selectedYear = value ? parseInt(value.split('-')[0]) : null;

    const totalDays = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const today = new Date();

    // Format display
    const displayValue = value
        ? new Date(value + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Seleccionar fecha';

    return (
        <div ref={ref} className="relative">
            {label && (
                <label htmlFor={id} className="block text-xs font-semibold text-finance-muted mb-1.5 uppercase tracking-wide">
                    {label}
                </label>
            )}
            <button
                id={id}
                type="button"
                onClick={() => setOpen(o => !o)}
                className="input-field w-full flex items-center justify-between gap-2 cursor-pointer text-left"
            >
                <span className={value ? 'text-white' : 'text-slate-500'}>
                    {displayValue}
                </span>
                <Calendar size={15} className="text-slate-400 flex-shrink-0" />
            </button>

            {open && (
                <div className="absolute z-[200] mt-2 w-72 bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-in origin-top-left">
                    {/* Header mes/año */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                        <button type="button" onClick={prevMonth} className="p-1 hover:text-white text-slate-400 transition-colors rounded-lg hover:bg-white/5">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-black uppercase tracking-widest text-white">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth} className="p-1 hover:text-white text-slate-400 transition-colors rounded-lg hover:bg-white/5">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-slate-600 py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
                            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                            return (
                                <button
                                    type="button"
                                    key={day}
                                    onClick={() => handleSelectDay(day)}
                                    className={`
                                        relative h-8 w-full rounded-lg text-xs font-bold transition-all
                                        ${isSelected
                                            ? 'bg-[#00D4FF] text-black shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                                            : isToday
                                                ? 'text-[#00D4FF] ring-1 ring-[#00D4FF]/40'
                                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Botón hoy */}
                    <div className="border-t border-white/5 px-3 py-2">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                setViewYear(now.getFullYear());
                                setViewMonth(now.getMonth());
                                handleSelectDay(now.getDate());
                            }}
                            className="w-full text-[10px] font-black uppercase tracking-widest text-[#00D4FF] hover:text-white transition-colors py-1"
                        >
                            Hoy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
