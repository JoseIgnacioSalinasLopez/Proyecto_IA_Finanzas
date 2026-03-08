import { supabase } from '../config/supabaseClient.js';

export const getStats = async (userId, filters = {}) => {
    // 1. Fetch current month's budget to compare
    const { data: budgets } = await supabase
        .from('budgets')
        .select('*, categories(name)')
        .eq('user_id', userId);

    // 2. Base query for transactions - Filter by date if provided to improve performance
    let query = supabase
        .from('transactions')
        .select('amount, type, date, category_id, categories(name, color)')
        .eq('user_id', userId);

    if (filters.startDate) {
        query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('date', filters.endDate);
    }

    const { data: allData, error } = await query;
    if (error) throw new Error(error.message);

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
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

            if (date >= thirtyDaysAgo) {
                expenseLast30Days += amount;
            }

            if (date >= startOfMonth) {
                if (!monthlyExpensesByCategory[categoryName]) {
                    monthlyExpensesByCategory[categoryName] = { amount: 0, color: categoryColor, category_id: t.category_id };
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

    // Budget Analysis
    const budgetAnalysis = (budgets || []).map(b => {
        const spent = monthlyExpensesByCategory[b.categories?.name]?.amount || 0;
        return {
            category: b.categories?.name,
            limit: Number(b.amount_limit),
            spent: Number(spent.toFixed(2)),
            remaining: Math.max(0, Number(b.amount_limit) - spent),
            percentage: Math.min(100, (spent / Number(b.amount_limit)) * 100)
        };
    });

    // Fetch goals and events for the dashboard
    const [{ data: goals }, { data: manualEvents }] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', userId).order('deadline', { ascending: true }),
        supabase.from('timeline_events').select('*').eq('user_id', userId).order('date', { ascending: true })
    ]);

    return {
        summary: {
            totalIncome,
            totalExpense,
            balance,
            dailyBurnRate: Number(dailyBurnRate.toFixed(2)),
            bufferTime: Math.max(0, Math.floor(bufferTime)),
            riskLevel,
            totalBudget: budgetAnalysis.reduce((acc, b) => acc + b.limit, 0),
            totalSpentThisMonth: Object.values(monthlyExpensesByCategory).reduce((acc, c) => acc + c.amount, 0)
        },
        expensesByCategory: Object.entries(expensesByCategory).map(([name, data]) => ({ name, ...data })),
        incomeByCategory: Object.entries(incomeByCategory).map(([name, data]) => ({ name, ...data })),
        monthlyExpensesByCategory: Object.entries(monthlyExpensesByCategory).map(([name, data]) => ({ name, ...data })),
        timeline: Object.entries(timeline).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date) - new Date(b.date)),
        goals: goals || [],
        budgetAnalysis,
        manualEvents: manualEvents || []
    };
};

