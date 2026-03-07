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

    const { data: allData, error } = await query;
    if (error) throw new Error(error.message);

    // Get current date and date 30 days ago for Survival Engine
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get start of current month for Budget Allocations
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalIncome = 0;
    let totalExpense = 0;
    let expenseLast30Days = 0;
    const expensesByCategory = {};
    const incomeByCategory = {};
    const timeline = {};
    const monthlyExpensesByCategory = {};

    allData.forEach((t) => {
        const amount = Number(t.amount);
        const categoryName = t.categories?.name || 'Sin Categoría';
        const categoryColor = t.categories?.color || '#cccccc';
        const date = new Date(t.date);
        const dateStr = t.date.split('T')[0];

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

            // Survival Engine: Last 30 days expenses
            if (date >= thirtyDaysAgo) {
                expenseLast30Days += amount;
            }

            // Budget Allocations: Current month expenses
            if (date >= startOfMonth) {
                if (!monthlyExpensesByCategory[categoryName]) {
                    monthlyExpensesByCategory[categoryName] = { amount: 0, color: categoryColor };
                }
                monthlyExpensesByCategory[categoryName].amount += amount;
            }
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

    const balance = totalIncome - totalExpense;
    const dailyBurnRate = expenseLast30Days / 30;
    const bufferTime = dailyBurnRate > 0 ? balance / dailyBurnRate : (balance > 0 ? 999 : 0);

    let riskLevel = 'BAJO';
    if (bufferTime < 30) riskLevel = 'CRÍTICO';
    else if (bufferTime < 90) riskLevel = 'MEDIO';

    // Recurrent Expenses Detection
    const descriptionCounts = {};
    allData.filter(t => t.type === 'expense').forEach(t => {
        const desc = t.description?.toLowerCase().trim();
        if (desc) {
            descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
        }
    });
    const recurrentExpenses = Object.entries(descriptionCounts)
        .filter(([_, count]) => count >= 2)
        .map(([desc]) => desc);

    // Fetch goals for the dashboard
    const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('deadline', { ascending: true });

    // Fetch manual timeline events
    const { data: manualEvents, error: eventsError } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

    return {
        summary: {
            totalIncome,
            totalExpense,
            balance,
            dailyBurnRate: Number(dailyBurnRate.toFixed(2)),
            bufferTime: Math.max(0, Math.floor(bufferTime)),
            riskLevel
        },
        expensesByCategory: Object.entries(expensesByCategory).map(([name, data]) => ({ name, ...data })),
        incomeByCategory: Object.entries(incomeByCategory).map(([name, data]) => ({ name, ...data })),
        monthlyExpensesByCategory: Object.entries(monthlyExpensesByCategory).map(([name, data]) => ({ name, ...data })),
        timeline: Object.entries(timeline).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date) - new Date(b.date)),
        goals: goals || [],
        recurrentExpenses,
        manualEvents: manualEvents || []
    };
};
