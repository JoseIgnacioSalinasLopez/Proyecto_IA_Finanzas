import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAnonRead() {
    console.log('Testing reading notifications with ANON KEY...');

    // We need a valid user session or at least try to read.
    // If RLS is on and no policy exists, this should return empty or error.
    const { data, error } = await supabase
        .from('notifications')
        .select('*');

    if (error) {
        console.error('Anon Read Error:', error.message);
    } else {
        console.log('Anon Read Success. Found:', data.length, 'notifications.');
        if (data.length === 0) {
            console.log('Zero notifications found. This usually means RLS is blocking access (if rows exist in DB).');
        }
    }
}

testAnonRead();
