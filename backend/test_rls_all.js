import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testRLS() {
    const tables = ['transactions', 'categories', 'goals', 'timeline_events', 'budgets', 'notifications'];
    for (const table of tables) {
        const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`Table: ${table} | Status: ${error ? 'ERROR: ' + error.message : 'OK'} | Count: ${count}`);
    }
}

testRLS();
