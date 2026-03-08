import { supabase } from '../config/supabaseClient.js';
import { createNotification } from './notification.service.js';

export const getBudgets = async (userId) => {
    const { data, error } = await supabase
        .from('budgets')
        .select(`
            *,
            categories (name, color)
        `)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data;
};

export const upsertBudget = async (userId, dataPayload) => {
    const { category_id, amount_limit, period = 'monthly' } = dataPayload;
    
    const { data, error } = await supabase
        .from('budgets')
        .upsert({
            user_id: userId,
            category_id,
            amount_limit,
            period
        }, { onConflict: 'user_id,category_id,period' })
        .select()
        .single();

    if (error) throw new Error(error.message);

    await createNotification(
        userId, 
        'Apartado Modificado', 
        `Has configurado un apartado con límite de $${Number(amount_limit).toLocaleString()}`, 
        'success'
    );

    return data;
};

export const deleteBudget = async (userId, budgetId) => {
    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);

    await createNotification(
        userId, 
        'Apartado Eliminado', 
        'Has removido un límite de presupuesto', 
        'alert'
    );

    return true;
};
