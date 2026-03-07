import { supabase } from '../config/supabaseClient.js';

export const getGoals = async (userId) => {
    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('deadline', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
};

export const createGoal = async (userId, goalData) => {
    const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goalData, user_id: userId }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const updateGoal = async (userId, goalId, goalData) => {
    const { data, error } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const deleteGoal = async (userId, goalId) => {
    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
};
