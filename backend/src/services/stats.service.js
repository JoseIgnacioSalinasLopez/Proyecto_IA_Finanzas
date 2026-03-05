import { supabase } from '../config/supabaseClient.js';

export const getStats = async (userId, filters = {}) => {
    // Base query for transactions
    let query = supabase
        .from('transactions')
        .select('amount, type, date, categories(name, color)')
        .eq('user_id', userId);

    if (filters.startDate) {
        query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let totalIncome = 0;
    let totalExpense = 0;
    const expensesByCategory = {};
    const incomeByCategory = {};
    const timeline = {};

    data.forEach((t) => {
        const amount = Number(t.amount);
        const categoryName = t.categories?.name || 'Uncategorized';
        const categoryColor = t.categories?.color || '#cccccc';
        const dateStr = t.date.split('T')[0]; // simple YYYY-MM-DD grouping

        if (t.type === 'income') {
            totalIncome += amount;
            if (!incomeByCategory[categoryName]) {
                incomeByCategory[categoryName] = { amount: 0, color: categoryColor };
            }
            incomeByCategory[categoryName].amount += amount;
        } else {
            totalExpense += amount;
            if (!expensesByCategory[categoryName]) {
                expensesByCategory[categoryName] = { amount: 0, color: categoryColor };
            }
            expensesByCategory[categoryName].amount += amount;
        }

        if (!timeline[dateStr]) {
            timeline[dateStr] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            timeline[dateStr].income += amount;
        } else {
            timeline[dateStr].expense += amount;
        }
    });

    return {
        summary: { totalIncome, totalExpense, balance: totalIncome - totalExpense },
        expensesByCategory: Object.entries(expensesByCategory).map(([name, data]) => ({ name, ...data })),
        incomeByCategory: Object.entries(incomeByCategory).map(([name, data]) => ({ name, ...data })),
        timeline: Object.entries(timeline).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date) - new Date(b.date))
    };
};
