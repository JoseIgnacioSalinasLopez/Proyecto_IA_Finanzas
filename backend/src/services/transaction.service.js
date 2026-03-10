import { supabase } from '../config/supabaseClient.js';
import { createNotification } from './notification.service.js';

export const getTransactions = async (userId, filters = {}) => {
    let query = supabase
        .from('transactions')
        .select(`
      *,
      categories (
        name,
        color
      )
    `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

    // Add optional filters dynamically
    if (filters.startDate) {
        query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('date', filters.endDate);
    }
    if (filters.type) {
        query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
};

export const createTransaction = async (userId, dataPayload) => {
    const { amount, type, category_id, description, date } = dataPayload;

    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            user_id: userId,
            amount,
            type,
            category_id,
            description,
            date: date || new Date().toISOString()
        }])
        .select()
        .single();
    if (error) {
        console.error('DATABASE ERROR creating transaction:', error);
        throw new Error(error.message);
    }

    await createNotification(
        userId,
        type === 'income' ? 'Nuevo Ingreso' : 'Nuevo Gasto',
        `Registraste un ${type === 'income' ? 'ingreso' : 'gasto'} por $${Number(amount).toLocaleString()}`,
        'success'
    );

    return data;
};

export const updateTransaction = async (userId, transactionId, dataPayload) => {
    const { data, error } = await supabase
        .from('transactions')
        .update(dataPayload)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);

    await createNotification(
        userId,
        'Transacción Actualizada',
        `Has modificado una transacción de $${Number(dataPayload.amount || data.amount).toLocaleString()}`,
        'info'
    );

    return data;
};

export const deleteTransaction = async (userId, transactionId) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);

    await createNotification(
        userId,
        'Transacción Eliminada',
        'Has eliminado una transacción de tu registro',
        'alert'
    );

    return true;
};
