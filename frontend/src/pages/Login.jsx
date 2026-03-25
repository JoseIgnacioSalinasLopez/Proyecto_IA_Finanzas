import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import appLogo from '../assets/lanatrix.png';
import appLogoLight from '../assets/lanatrix claro.png';
import { useTheme } from '../context/ThemeContext';
import fondoLogin from '../assets/fondo-login.png';
import fondoLoginLight from '../assets/fondo-login-claro.png';
import { useAuth } from '../hooks/useAuth';
import { ChevronRight, Mail, Lock, User, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registerStep, setRegisterStep] = useState(1);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, registerUser, loginWithGoogle } = useAuth();
    const navigate = useNavigate();



    // Reset error when view changes
    useEffect(() => {
        setError('');
    }, [currentView]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || t('error_loading'));
        } finally {
            setLoading(false);
        }
    };

    const toggleView = (view) => {
        setCurrentView(view);
        setRegisterStep(1);
        setRegisterSuccess(false);
        setError('');
        setConfirmPassword('');
    };

    const handleNextStep = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!fullName.trim()) {
            setError(t('enter_full_name'));
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) {
            setError(t('enter_valid_email'));
            return;
        }
        setError('');
        setRegisterStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError(t('password_len'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('passwords_mismatch'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            await registerUser(fullName, email, password);
            setRegisterSuccess(true);
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || t('registration_err'));
        } finally {
            setLoading(false);
        }
    };

    const getSlideClass = () => {
        if (currentView === 'login') return 'slide-to-login';
        if (currentView === 'register') return 'slide-to-register';
        return 'slide-to-forgot';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative bg-finance-900 transition-colors duration-500">

            {/* Capa 1: Gradiente Animado Épico (Fondo base) */}
            <div className="absolute inset-0 epic-bg-animate z-0"></div>

            {/* Capa 2: Imagen de Fondo (La "Pintura" del fondo) */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50 transition-all duration-1000"
                style={{
                    backgroundImage: `url(${isLight ? fondoLoginLight : fondoLogin})`,
                    transform: isExpanded ? 'scale(1.05)' : 'scale(1.0)', // Se aleja/acerca sutilmente
                    filter: isLight ? 'brightness(1.0) contrast(1.0)' : 'brightness(0.7) contrast(1.1)'
                }}
            ></div>

            {/* Dark/Light Overlay for Image Background Contrast */}
            <div className={`absolute inset-0 z-0 transition-colors duration-1000 ${isLight ? 'bg-slate-200/40 backdrop-blur-[2px]' : 'bg-black/40'}`}></div>

            {/* Background Particles & Sparkles */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className={`particle ${i % 4 === 0 ? 'particle-yellow' : 'particle-cyan'}`}
                        style={{
                            width: i % 4 === 0 ? '3px' : '4px',
                            height: i % 4 === 0 ? '3px' : '4px',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 15 + 10}s`,
                            animationDelay: `${-Math.random() * 20}s`,
                            opacity: Math.random() * 0.4 + 0.1,
                            background: i % 4 === 0 ? '#FFD166' : '#00D4FF',
                            boxShadow: i % 4 === 0 ? '0 0 8px #FFD166' : '0 0 10px #7DF9FF'
                        }}
                    ></div>
                ))}
            </div>

            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-epic-purple/20 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-epic-cyan/20 blur-[100px] rounded-full"></div>

            {/* Card Principal Épica */}
            <div
                className={`w-full max-w-[440px] epic-border-card transition-all duration-700 ease-out animate-entrance ${isExpanded ? 'scale-100 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' : 'scale-95 hover:scale-100'}`}
                onMouseEnter={() => setIsExpanded(true)}
                onClick={() => setIsExpanded(true)}
            >
                <div className={`${isExpanded ? 'p-10' : 'p-2'} relative z-20 transition-all duration-500`}>
                    {/* Encabezado Principal / Compact Holder */}
                    <div
                        className={`text-center transition-all duration-700 ${!isExpanded ? 'cursor-pointer' : 'mb-6'}`}
                        onClick={() => setIsExpanded(true)}
                    >
                        {!isExpanded ? (
                            <div className="neomorp-inner group py-2 flex flex-col items-center justify-center animate-pulse-slow">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_10px_#00D4FF] animate-ping"></div>
                                    <h1 className="text-xl font-black text-finance-text uppercase tracking-[0.3em] group-hover:tracking-[0.4em] transition-all">{t('start_session')}</h1>
                                    <div className="w-3 h-3 bg-[#8C30F5] rounded-sm rotate-45 shadow-[0_0_10px_#8C30F5]"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in text-center">
                                {/* Se eliminaron las clases de rotación y transformación */}
                                <div className="flex justify-center mb-6 cursor-pointer">
                                    <img src={isLight ? appLogoLight : appLogo} alt="Logo" className="h-16 w-auto drop-shadow-[0_0_20px_rgba(0,212,255,0.6)]" />
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter leading-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[var(--epic-purple)] via-[var(--epic-indigo)] to-[var(--epic-blue)] drop-shadow-sm">
                                    {currentView === 'login' ? t('welcome_elite') : currentView === 'register' ? t('create_account_elite') : t('recover_elite')}
                                </h1>
                                <p className="text-slate-400 font-bold text-lg">
                                    {currentView === 'login' ? t('manage_future') : t('join_elite')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Contenedor Expandible */}
                    <div className={`expandable-container ${isExpanded ? 'is-expanded' : ''}`}>
                        <div className={`overflow-hidden ${isExpanded ? 'pt-4' : 'pt-0'} ${error ? 'animate-shake' : ''}`}>

                            {error && (
                                <div className="bg-[#FF4DA6]/10 border border-[#FF4DA6]/30 text-[#FF4DA6] px-4 py-3 rounded-xl mb-6 text-xs flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4DA6] animate-pulse"></div>
                                    {error}
                                </div>
                            )}
                            {/* Contenedores de Formularios Aislados */}
                            <div className={`w-full relative ${isExpanded ? 'min-h-[350px]' : 'min-h-0'}`}>

                                {/* FORMULARIO: LOGIN */}
                                {currentView === 'login' && (
                                    <div className="animate-fade-in" id="login-form">
                                        <form onSubmit={handleLogin} className="space-y-6">
                                            <div className="floating-label-group">
                                                <input
                                                    type="email"
                                                    placeholder=" "
                                                    className={`input-field placeholder-transparent ${error ? 'border-[#FF4DA6]/50' : 'focus:border-[#00D4FF]'}`}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                                <label className="text-finance-muted">{t('email_address')}</label>
                                            </div>

                                            <div className="floating-label-group relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder=" "
                                                    className={`input-field placeholder-transparent ${error ? 'border-[#FF4DA6]/50' : 'focus:border-[#00D4FF]'}`}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                                <label className="text-finance-muted">{t('change_password')}</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                                    tabIndex="-1"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>


                                            <div className="flex justify-between items-center px-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleView('forgot'); }}
                                                    className="text-[10px] font-bold text-[#00D4FF] hover:text-[#7DF9FF] transition-colors tracking-widest uppercase"
                                                >
                                                    {t('forgot_pwd_q_elite')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleView('register'); }}
                                                    className="text-[10px] font-bold text-[#FF4DA6] hover:text-[#00FFFF] transition-colors tracking-widest uppercase"
                                                >
                                                    {t('register_action')}
                                                </button>
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn-epic w-full uppercase tracking-[0.2em] text-sm py-4 text-[#00D4FF] font-black rounded-2xl shadow-[0_0_20px_rgba(0,212,255,0.2)]"
                                                disabled={loading}
                                            >
                                                {loading ? <RefreshCw className="animate-spin mx-auto" size={18} /> : t('login_button')}
                                            </button>

                                            <div className="relative py-4">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                                <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em] font-black text-slate-600"><span className="bg-finance-900 px-4">{t('continue_with')}</span></div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => loginWithGoogle()}
                                                    className={`flex items-center justify-center gap-3 w-full py-3 rounded-2xl transition-all group ${isLight
                                                        ? 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50'
                                                        : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20'
                                                        }`}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={`${isLight ? '' : 'text-white'} group-hover:text-blue-400 transition-colors`}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isLight ? 'text-slate-600' : 'text-slate-300'
                                                        }`}>
                                                        {t('google_sign_in')}
                                                    </span>
                                                </button>
                                            </div>


                                        </form>
                                    </div>
                                )}

                                {/* FORMULARIO: REGISTRO */}
                                {currentView === 'register' && (
                                    <div className="animate-fade-in" id="register-form">
                                        {/* Indicador de pasos */}
                                        <div className="flex items-center justify-center gap-2 mb-5">
                                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${registerStep >= 1 ? 'bg-[#00D4FF] shadow-[0_0_8px_#00D4FF]' : 'bg-white/10'}`} />
                                            <div className={`w-8 h-[1px] transition-all duration-300 ${registerStep >= 2 ? 'bg-[#00D4FF]' : 'bg-white/10'}`} />
                                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${registerStep >= 2 ? 'bg-[#00D4FF] shadow-[0_0_8px_#00D4FF]' : 'bg-white/10'}`} />
                                        </div>

                                        {registerSuccess ? (
                                            <div className="text-center py-6 animate-fade-in">
                                                <div className="w-14 h-14 rounded-full bg-[#00FFFF]/20 flex items-center justify-center mx-auto mb-4">
                                                    <svg className="text-[#00FFFF]" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <p className="text-[#00FFFF] font-black text-sm uppercase tracking-widest">{t('account_created')}</p>
                                                <p className="text-slate-500 text-xs mt-1">{t('entering_dashboard')}</p>
                                            </div>
                                        ) : registerStep === 1 ? (
                                            <div className="space-y-5">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">{t('step_1_personal')}</p>
                                                <div className="floating-label-group">
                                                    <input
                                                        type="text"
                                                        placeholder=" "
                                                        className="input-field placeholder-transparent"
                                                        value={fullName}
                                                        onChange={(e) => setFullName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleNextStep(e)}
                                                    />
                                                    <label className="text-finance-muted">{t('full_name')}</label>
                                                </div>
                                                <div className="floating-label-group">
                                                    <input
                                                        type="email"
                                                        placeholder=" "
                                                        className="input-field placeholder-transparent"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleNextStep(e)}
                                                    />
                                                    <label className="text-finance-muted">{t('email_address')}</label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleNextStep}
                                                    className="btn-epic w-full uppercase tracking-[0.2rem] text-xs py-4 text-[#00D4FF] font-black rounded-2xl flex items-center justify-center gap-2"
                                                >
                                                    {t('next_step')} <ChevronRight size={15} />
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleRegister} className="space-y-5">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">{t('step_2_password')}</p>
                                                <div className="floating-label-group relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder=" "
                                                        className="input-field pr-12 placeholder-transparent"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        minLength={6}
                                                        autoFocus
                                                    />
                                                    <label className="text-finance-muted">{t('password_field')}</label>
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors" tabIndex="-1">
                                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                                    </button>
                                                </div>
                                                <div className="floating-label-group relative">
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        placeholder=" "
                                                        className={`input-field pr-12 placeholder-transparent ${confirmPassword && confirmPassword !== password
                                                            ? 'border-[#FF4DA6]/50'
                                                            : confirmPassword && confirmPassword === password
                                                                ? 'border-[#00FFFF]/50'
                                                                : ''
                                                            }`}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                    />
                                                    <label className="text-finance-muted">{t('confirm_password_field')}</label>
                                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors" tabIndex="-1">
                                                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setRegisterStep(1); setError(''); }}
                                                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-white/5 rounded-2xl hover:border-white/20 transition-all"
                                                    >
                                                        {t('back_action')}
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="flex-[2] btn-epic py-4 text-[#00D4FF] font-black rounded-2xl uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-2"
                                                    >
                                                        {loading ? <RefreshCw className="animate-spin" size={16} /> : t('create_account_action')}
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {!registerSuccess && (
                                            <div className="mt-6 text-center pt-5 border-t border-white/5">
                                                <button onClick={(e) => { e.stopPropagation(); toggleView('login'); }} className="text-xs text-slate-300 font-black hover:underline uppercase tracking-widest">
                                                    {t('back_to_login_elite')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* FORMULARIO: RECUPERACIÓN */}
                                {currentView === 'forgot' && (
                                    <div className="animate-fade-in" id="recover-form">
                                        <div className="space-y-6">
                                            <p className="text-xs text-slate-400 text-center px-4 leading-relaxed">
                                                {t('recover_desc_elite')}
                                            </p>
                                            <div className="floating-label-group">
                                                <input
                                                    type="email"
                                                    placeholder=" "
                                                    className="input-field placeholder-transparent"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                                <label className="text-finance-muted">{t('email_address')}</label>
                                            </div>
                                            <button className="btn-epic w-full uppercase tracking-[0.2rem] text-xs py-4 text-[#00D4FF] font-black rounded-2xl">{t('send_link')}</button>
                                        </div>
                                        <div className="mt-8 text-center pt-6 border-t border-white/5">
                                            <button onClick={(e) => { e.stopPropagation(); toggleView('login'); }} className="text-xs text-slate-300 font-black hover:underline uppercase tracking-widest">
                                                {t('back_to_login_elite')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hint */}
            {!isExpanded && (
                <p className="absolute bottom-10 text-[10px] text-finance-primary font-black uppercase tracking-[0.5em] animate-pulse drop-shadow-[0_0_10px_rgba(0,212,255,0.8)] z-30">
                    {t('interact')}
                </p>
            )}
        </div>
    );
}
