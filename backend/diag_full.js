import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- DIAGNOSTIC START ---');

    console.log('Fetching users...');
    const { data: users, error: uErr } = await supabase.from('users').select('id, name, email');
    if (uErr) { console.error('User Error:', uErr); return; }
    const userMap = {};
    users?.forEach(u => userMap[u.id] = u);

    console.log('Fetching budgets...');
    const { data: budgets, error: bErr } = await supabase.from('budgets').select('*, categories(name)');
    if (bErr) console.error('Budget Error:', bErr);

    console.log('Fetching goals...');
    const { data: goals, error: gErr } = await supabase.from('goals').select('*');
    if (gErr) console.error('Goal Error:', gErr);

    console.log('\n--- BUDGETS BY USER ---');
    const groupedBudgets = {};
    budgets?.forEach(b => {
        if (!groupedBudgets[b.user_id]) groupedBudgets[b.user_id] = { user: userMap[b.user_id], total: 0, entries: [] };
        groupedBudgets[b.user_id].total += Number(b.amount_limit);
        groupedBudgets[b.user_id].entries.push(b);
    });
    Object.values(groupedBudgets).forEach(g => {
        console.log(`User: ${g.user?.name} | Total Budget: $${g.total}`);
        g.entries.forEach(e => console.log(`  - ${e.categories?.name}: $${e.amount_limit}`));
    });

    console.log('\n--- GOALS BY USER ---');
    const groupedGoals = {};
    goals?.forEach(g => {
        if (!groupedGoals[g.user_id]) groupedGoals[g.user_id] = { user: userMap[g.user_id], totalTarget: 0, totalCurrent: 0, entries: [] };
        groupedGoals[g.user_id].totalTarget += Number(g.target_amount);
        groupedGoals[g.user_id].totalCurrent += Number(g.current_amount);
        groupedGoals[g.user_id].entries.push(g);
    });
    Object.values(groupedGoals).forEach(g => {
        console.log(`User: ${g.user?.name} | Total Target: $${g.totalTarget} | Total Current: $${g.totalCurrent}`);
        g.entries.forEach(e => console.log(`  - ${e.name}: Target $${e.target_amount}, Current $${e.current_amount}`));
    });

    console.log('\n--- DIAGNOSTIC END ---');
}

check();
