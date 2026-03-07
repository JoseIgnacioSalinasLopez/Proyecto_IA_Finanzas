import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jdojgsvtmsxfntrtulhx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2pnc3Z0bXN4Zm50cnR1bGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mzk1OTQsImV4cCI6MjA4ODIxNTU5NH0.UOyHJMLBJMHNRSNrxgIsWFMhCO5rbAB4iN8CwBsfpQg';

export const supabase = createClient(supabaseUrl, supabaseKey);
