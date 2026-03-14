import { supabase } from '../config/supabaseClient.js';
import { createNotification } from './notification.service.js';
import * as statsService from './stats.service.js';

/**
 * Budget Guard Service
 * Monitorea los presupuestos y envía alertas preventivas.
 */

export const checkBudgetThreshold = async (userId, categoryId, amount) => {
    try {
        // --- 1. VIGILANCIA POR CATEGORÍA ---
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: budgets, error: bError } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId)
            .eq('category_id', categoryId)
            .limit(1);

        if (!bError && budgets && budgets.length > 0) {
            const budget = budgets[0];
            const budgetLimit = budget.amount_limit;

            const { data: transactions, error: tError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', userId)
                .eq('category_id', categoryId)
                .eq('type', 'expense')
                .gte('date', startOfMonth.toISOString());

            if (!tError) {
                const totalSpent = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
                const percentage = (totalSpent / budgetLimit) * 100;

                if (percentage >= 90 && percentage < 100) {
                    await createNotification(
                        userId,
                        '🛡️ Alerta del Guardián',
                        `Has alcanzado el ${Math.round(percentage)}% de tu presupuesto en esta categoría.`,
                        'alert'
                    );
                } else if (percentage >= 100) {
                    await createNotification(
                        userId,
                        '⚠️ Presupuesto Excedido',
                        `Has superado el límite de $${budgetLimit} para esta categoría.`,
                        'alert'
                    );
                }
            }
        }

        // --- 2. VIGILANCIA DE BALANCE DISPONIBLE (ESCUDO DE EMERGENCIA) ---
        const stats = await statsService.getStats(userId);
        const liquidBalance = stats.summary.liquidBalance;
        
        // Umbral crítico: $1000 (o lo que consideres)
        if (liquidBalance < 1000 && liquidBalance > 0) {
            await createNotification(
                userId,
                '🚨 Escudo de Emergencia',
                `Tu saldo disponible real es crítico ($${liquidBalance.toFixed(2)}). ¡Evita gastos no esenciales!`,
                'alert'
            );
        } else if (liquidBalance <= 0) {
            await createNotification(
                userId,
                '🛑 Saldo Agotado',
                'Tu saldo disponible real ha llegado a cero. Estás utilizando dinero que estaba destinado a Metas o Inversiones.',
                'alert'
            );
        }

    } catch (error) {
        console.error('Guardian Service Error:', error);
    }
};
