import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findValue() {
    console.log('Searching for 550 or 2050...');

    const { data: b550 } = await supabase.from('budgets').select('*').eq('amount_limit', 550);
    const { data: b2050 } = await supabase.from('budgets').select('*').eq('amount_limit', 2050);

    const { data: t550 } = await supabase.from('transactions').select('*').eq('amount', 550);
    const { data: t2050 } = await supabase.from('transactions').select('*').eq('amount', 2050);

    console.log('Budgets with 550:', b550?.length || 0);
    console.log('Budgets with 2050:', b2050?.length || 0);
    console.log('Transactions with 550:', t550?.length || 0);
    console.log('Transactions with 2050:', t2050?.length || 0);

    if (t2050 && t2050.length > 0) {
        console.log('Transaction 2050 details:', t2050);
    }
}

findValue();
