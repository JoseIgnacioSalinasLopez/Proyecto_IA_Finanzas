import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Fetching all budgets...');
    const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*, categories(name)');

    if (error) {
        console.error('Error fetching budgets:', error);
        return;
    }

    const { data: users } = await supabase.from('users').select('id, name, email');
    const userMap = {};
    users?.forEach(u => userMap[u.id] = u);

    const grouped = {};
    budgets?.forEach(b => {
        if (!grouped[b.user_id]) grouped[b.user_id] = { user: userMap[b.user_id], entries: [], total: 0 };
        grouped[b.user_id].entries.push(b);
        grouped[b.user_id].total += Number(b.amount_limit);
    });

    console.log('\nBudget Totals by User:');
    Object.values(grouped).forEach(g => {
        console.log(`User: ${g.user?.name || 'Unknown'} (${g.user?.email || 'N/A'})`);
        console.log(`- Total Budget: $${g.total}`);
        g.entries.forEach(e => {
            console.log(`  * ${e.categories?.name}: $${e.amount_limit}`);
        });
        console.log('---');
    });
}

check();
