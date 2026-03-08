import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testUpsert() {
    // try fetching a valid user
    const { data: users, error: uErr } = await supabase.from('users').select('id').limit(1);
    if (uErr) { console.error('fetch user err:', uErr); return; }
    if (!users.length) { console.log('No user'); return; }
    
    // fetch a category
    const { data: cats, error: cErr } = await supabase.from('categories').select('id').eq('user_id', users[0].id).limit(1);
    if (!cats || !cats.length) { console.log('No category'); return; }

    const userId = users[0].id;
    const category_id = cats[0].id;
    const amount_limit = 500;
    const period = 'monthly';

    const { data, error } = await supabase
        .from('budgets')
        .upsert({
            user_id: userId,
            category_id,
            amount_limit,
            period
        }, { onConflict: 'user_id,category_id,period' })
        .select()
        .single();
    
    console.log("Upsert Error:", error);
    console.log("Upsert Data:", data);
}

testUpsert();
