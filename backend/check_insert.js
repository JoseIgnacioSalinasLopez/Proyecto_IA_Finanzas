import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function inspect() {
    const { data, error } = await supabase.from('notifications').select('*').limit(1);
    console.log("Error:", error);
    
    // Also try inserting one notification
    const { data: iData, error: iErr } = await supabase.from('notifications').insert([{
        user_id: 'dummy',
        title: 'Test',
        message: 'Test message',
        type: 'info'
    }]).select();
    console.log("Insert Error:", iErr);
    console.log("Insert Data:", iData);
}
inspect();
