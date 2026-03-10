import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function search2050() {
    console.log('Searching for 2050 in all relevant tables...');

    const tables = ['budgets', 'transactions', 'goals'];
    for (const table of tables) {
        console.log(`Checking ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error in ${table}:`, error);
            continue;
        }

        data.forEach(row => {
            for (const [key, value] of Object.entries(row)) {
                if (Number(value) === 2050) {
                    console.log(`MATCH FOUND in ${table}:`, row);
                }
                // Also check if it's a sum
                if (key === 'amount_limit' || key === 'amount' || key === 'target_amount' || key === 'current_amount') {
                    // Logic to check if user total is 2050
                }
            }
        });
    }

    // Check totals per user
    const { data: users } = await supabase.from('users').select('id, name');
    for (const user of users) {
        const { data: b } = await supabase.from('budgets').select('amount_limit').eq('user_id', user.id);
        const totalB = b?.reduce((acc, curr) => acc + Number(curr.amount_limit), 0);
        if (totalB === 2050) console.log(`User ${user.name} (${user.id}) has total budget 2050`);

        const { data: t } = await supabase.from('transactions').select('amount, type').eq('user_id', user.id);
        const income = t?.filter(tx => tx.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const expense = t?.filter(tx => tx.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
        if (income === 2050) console.log(`User ${user.name} has total income 2050`);
        if (expense === 2050) console.log(`User ${user.name} has total expense 2050`);
        if (income - expense === 2050) console.log(`User ${user.name} has balance 2050`);
    }
    console.log('Search finished.');
}

search2050();
