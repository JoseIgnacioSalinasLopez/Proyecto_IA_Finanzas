import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTransactions() {
    console.log('--- TRANSACTION DIAGNOSTIC ---');

    console.log('Fetching users...');
    const { data: users } = await supabase.from('users').select('id, name, email');
    const userMap = {};
    users?.forEach(u => userMap[u.id] = u);

    console.log('Fetching transactions...');
    const { data: txs, error: tErr } = await supabase.from('transactions').select('*');
    if (tErr) { console.error('Tx Error:', tErr); return; }

    const userStats = {};
    txs?.forEach(t => {
        if (!userStats[t.user_id]) userStats[t.user_id] = { user: userMap[t.user_id], income: 0, expense: 0, count: 0 };
        const amt = Number(t.amount);
        if (t.type === 'income') userStats[t.user_id].income += amt;
        else userStats[t.user_id].expense += amt;
        userStats[t.user_id].count++;
    });

    console.log('\nFinancial Summary by User:');
    Object.values(userStats).forEach(s => {
        const balance = s.income - s.expense;
        console.log(`User: ${s.user?.name} (${s.user?.email})`);
        console.log(`- Transactions: ${s.count}`);
        console.log(`- Total Income: $${s.income}`);
        console.log(`- Total Expense: $${s.expense}`);
        console.log(`- Balance: $${balance}`);
        console.log('---');
    });

    console.log('\n--- END ---');
}

checkTransactions();
