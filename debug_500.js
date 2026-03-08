
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jdojgsvtmsxfntrtulhx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2pnc3Z0bXN4Zm50cnR1bGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzOTU5NCwiZXhwIjoyMDg4MjE1NTk0fQ.NKZg97bG-p5122iu0NzkaN7vROYuq7x_8BA8rPaqeEc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugUpdate() {
    // Try to find a valid user_id first from budgets or users
    const { data: userData } = await supabase.from('users').select('id').limit(1).single();
    if (!userData) {
        console.log('No user found to test with');
        return;
    }
    const userId = userData.id;
    console.log('Testing with User ID:', userId);

    const payload = {
        user_id: userId,
        budget_alerts: true,
        login_alerts: true,
        weekly_reports: false,
        ai_tips: true,
        hide_challenges: true,
        hide_forecasts: true
    };

    const { data, error } = await supabase
        .from('user_preferences')
        .upsert(payload)
        .select();

    if (error) {
        console.error('❌ SUPABASE ERROR:', error.message);
        console.error('Code:', error.code);
        console.error('Details:', error.details);
    } else {
        console.log('✅ Success:', data);
    }
}

debugUpdate();
