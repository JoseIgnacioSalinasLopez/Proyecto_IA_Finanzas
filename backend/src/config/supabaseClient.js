import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
export const config = dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found in environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY inside .env');
}

export const supabase = createClient(supabaseUrl || 'https://xyz.supabase.co', supabaseKey || 'placeholder');
