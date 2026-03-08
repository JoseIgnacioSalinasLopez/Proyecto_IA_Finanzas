import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function test() {
    // Get first user from public.users
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users?.length) { console.log('No users found'); return; }
    const userId = users[0].id;

    // Get a category
    const { data: cats } = await supabase.from('categories').select('id').eq('user_id', userId).limit(1);
    if (!cats?.length) { console.log('No categories found for user'); return; }
    const catId = cats[0].id;

    console.log('userId:', userId);
    console.log('catId:', catId);

    // Try direct insert
    const { data, error } = await supabase
        .from('budgets')
        .insert([{
            user_id: userId,
            category_id: catId,
            amount_limit: 1000,
            period: 'monthly'
        }])
        .select();
    
    console.log('Direct insert error:', JSON.stringify(error, null, 2));
    console.log('Direct insert data:', data);
}
test();
