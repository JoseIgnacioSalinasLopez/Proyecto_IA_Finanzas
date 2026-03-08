-- ==========================================
-- MENTE BILLETE - ESQUEMA DE BASE DE DATOS
-- ==========================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. TABLAS PRINCIPALES

-- Usuarios (Basado en la estructura simplificada para el backend)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categorías
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#000000'
);

-- Transacciones
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Metas de Ahorro
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0.00,
  deadline DATE NOT NULL
);

-- Presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount_limit DECIMAL(12, 2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, category_id, period)
);

-- Preferencias de Usuario (Incluye Privacidad y Notificaciones)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    currency_symbol VARCHAR(5) DEFAULT '$',
    currency_code VARCHAR(10) DEFAULT 'MXN',
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'es',
    -- Filtros de Línea de Tiempo
    hide_challenges BOOLEAN DEFAULT false,
    hide_forecasts BOOLEAN DEFAULT false,
    -- Ajustes de Notificaciones
    budget_alerts BOOLEAN DEFAULT true,
    login_alerts BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    ai_tips BOOLEAN DEFAULT true,
    CONSTRAINT user_preferences_user_id_unique UNIQUE(user_id)
);

-- Documentos (Para el Asistente IA / Vectores)
CREATE TABLE IF NOT EXISTS public.documentos (
  id BIGSERIAL PRIMARY KEY,
  contenido TEXT,
  embedding VECTOR(768)
);

-- 3. SEGURIDAD (RLS)
-- Nota: Inicialmente deshabilitado para facilitar el desarrollo, pero estructurado para uso futuro.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (Solo para referencia)
-- CREATE POLICY "Users can manage their own profile" ON public.users FOR ALL USING (auth.uid() = id);
-- CREATE POLICY "Users can manage their own data" ON public.transactions FOR ALL USING (auth.uid() = user_id);
