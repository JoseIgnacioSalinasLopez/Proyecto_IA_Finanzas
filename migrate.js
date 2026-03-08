
const https = require('https');

const SUPABASE_URL = 'jdojgsvtmsxfntrtulhx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2pnc3Z0bXN4Zm50cnR1bGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzOTU5NCwiZXhwIjoyMDg4MjE1NTk0fQ.NKZg97bG-p5122iu0NzkaN7vROYuq7x_8BA8rPaqeEc';

const query = `
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS hide_challenges BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_forecasts BOOLEAN DEFAULT false;
`;

const data = JSON.stringify({ query });

const options = {
    hostname: SUPABASE_URL,
    path: '/rest/v1/rpc/execute_sql', // Note: This is a common way if enabled, but let's try direct SQL via POST if using service role
    // Actually, Supabase doesn't have a public SQL endpoint like that unless configured.
    // Let's use the standard POST to a table if it was flexible, but for ALTER TABLE we need SQL.
    // If the MCP tool fails, I'll try to use the backend's own connection if possible, or just fix the frontend PUT.
    method: 'POST'
};

// Re-thinking: Since I can't easily run SQL without a proper endpoint, 
// I will first fix the frontend PUT and see if it works. 
// If the table exists and it was created with JSONB or similar, it might work.
// But usually it's structured.
console.log('SQL Migration needs proper client. Fixing frontend PUT first.');
