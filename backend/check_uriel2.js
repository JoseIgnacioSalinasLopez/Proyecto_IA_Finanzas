import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUriel2() {
    const userId = '64eb86cd-e65f-43eb-af0f-c43f0be156ca';
    console.log(`Checking transactions for user uriel2 (${userId})...`);

    const { data: txs, error } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', userId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${txs.length} transactions:`);
    txs.forEach(t => {
        console.log(`- ID: ${t.id} | Amount: $${t.amount} | Type: ${t.type} | Category: ${t.categories?.name || 'N/A'} | Date: ${t.date} | Desc: ${t.description}`);
    });
}

checkUriel2();
