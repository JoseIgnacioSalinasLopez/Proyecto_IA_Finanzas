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

    // PROYECCIÓN DE FIN DE MES (NUEVO)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    const projectedAdditionalExpense = dailyBurnRate * daysRemaining;
    const projectedEndOfMonthBalance = balance - projectedAdditionalExpense;

    let riskLevel = 'BAJO';
    if (bufferTime < 30) riskLevel = 'CRÍTICO';
    else if (bufferTime < 90) riskLevel = 'MEDIO';

    // Análisis de Presupuesto
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

    // Fetch goals, events and debts (New: Debts)
    const [{ data: goals }, { data: manualEvents }, { data: debts }, { data: investmentCategories }] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', userId).order('deadline', { ascending: true }),
        supabase.from('timeline_events').select('*').eq('user_id', userId).order('date', { ascending: true }),
        supabase.from('transactions').select('amount, description, date').eq('user_id', userId).eq('type', 'expense').ilike('description', '%deuda%'), // Simple debt detection for now
        supabase.from('categories').select('id').eq('user_id', userId).ilike('name', '%inversión%')
    ]);

    const investmentCategoryIds = (investmentCategories || []).map(c => c.id);

    // Cálculos de Ahorro e Inversiones
    const totalGoalSavings = (goals || []).reduce((acc, g) => acc + Number(g.current_amount || 0), 0);
    
    let totalInvestments = 0;
    allData.forEach(t => {
        if (investmentCategoryIds.includes(t.category_id)) {
            totalInvestments += Number(t.amount);
        }
    });

    const liquidBalance = balance - totalGoalSavings - totalInvestments;

    // Recurrent Expenses Detection
    const subKeywords = ['netflix', 'spotify', 'disney', 'amazon', 'internet', 'teléfono', 'phone', 'cloud', 'seguro', 'gym', 'renta', 'luz', 'agua', 'gas'];
    const recurrentExpenses = new Set();
    allData.forEach(t => {
        if (t.type === 'expense' && t.description) {
            const desc = t.description.toLowerCase();
            if (subKeywords.some(key => desc.includes(key))) {
                recurrentExpenses.add(t.description);
            }
        }
    });

    return {
        summary: {
            totalIncome,
            totalExpense,
            balance: Number(balance.toFixed(2)),
            liquidBalance: Number(liquidBalance.toFixed(2)),
            totalGoalSavings: Number(totalGoalSavings.toFixed(2)),
            totalInvestments: Number(totalInvestments.toFixed(2)),
            dailyBurnRate: Number(dailyBurnRate.toFixed(2)),
            projectedEndOfMonthBalance: Number(projectedEndOfMonthBalance.toFixed(2)),
            daysRemainingInMonth: daysRemaining,
            bufferTime: Math.max(0, Math.floor(bufferTime)),
            riskLevel,
            totalBudget: Number(budgetAnalysis.reduce((acc, b) => acc + b.limit, 0).toFixed(2)),
            totalSpentThisMonth: Number(Object.values(monthlyExpensesByCategory).reduce((acc, c) => acc + c.amount, 0).toFixed(2))
        },
        recurrentExpenses: Array.from(recurrentExpenses),
        expensesByCategory: Object.entries(expensesByCategory).map(([name, data]) => ({ name, ...data })),
        incomeByCategory: Object.entries(incomeByCategory).map(([name, data]) => ({ name, ...data })),
        monthlyExpensesByCategory: Object.entries(monthlyExpensesByCategory).map(([name, data]) => ({ name, ...data })),
        timeline: Object.entries(timeline).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date) - new Date(b.date)),
        goals: goals || [],
        debts: debts || [],
        budgetAnalysis,
        manualEvents: manualEvents || []
    };
};

