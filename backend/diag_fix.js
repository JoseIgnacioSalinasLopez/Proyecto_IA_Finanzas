import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- START ---');
    try {
        const { data: users } = await supabase.from('users').select('id, name, email');
        const { data: budgets } = await supabase.from('budgets').select('*, categories(name)');
        const { data: txs } = await supabase.from('transactions').select('*, categories(name)');

        console.log('Users found:', users?.length);
        console.log('Budgets found:', budgets?.length);
        console.log('Transactions found:', txs?.length);

        const userID = '64eb86cd-e65f-43eb-af0f-c43f0be156ca'; // uriel2
        const uriel2Txs = txs?.filter(t => t.user_id === userID);
        console.log('\n--- URIEL2 TRANSACTIONS ---');
        let totalExp = 0;
        uriel2Txs?.forEach(t => {
            if (t.type === 'expense') totalExp += Number(t.amount);
            console.log(`- Amt: ${t.amount} | Type: ${t.type} | Date: ${t.date} | Desc: ${t.description}`);
        });
        console.log(`Total Expense for uriel2: ${totalExp}`);

    } catch (e) {
        console.error(e);
    }
    console.log('--- END ---');
    process.exit(0);
}

check();
