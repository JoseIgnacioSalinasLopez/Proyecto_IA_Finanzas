import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function checkNotifications() {
    console.log('Checking notifications table...');
    const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching notifications:', JSON.stringify(error, null, 2));
    } else {
        console.log('Total notifications in DB:', count);
        console.log('Sample data:', data.slice(0, 2));
    }

    // Check if RLS is enabled on notifications table
    const { data: rlsCheck, error: rlsError } = await supabase
        .rpc('get_policies', { table_name: 'notifications' }) // This might fail if RPC not exists
        .catch(() => ({ data: 'RPC fetch failed' }));

    console.log('RLS Check (via RPC):', rlsCheck || rlsError);

    // Alternative check for RLS via direct query if possible
    const { data: pgs, error: pgError } = await supabase.from('pg_tables').select('rowsecurity').eq('tablename', 'notifications');
    console.log('PG Row Security Check:', pgs || pgError);
}

checkNotifications();
