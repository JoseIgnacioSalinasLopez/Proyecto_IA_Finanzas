import { supabase } from '../config/supabaseClient.js';

export const getCategories = async (userId) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data;
};

export const createCategory = async (userId, name, color) => {
    const { data, error } = await supabase
        .from('categories')
        .insert([{ user_id: userId, name, color }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const updateCategory = async (userId, categoryId, name, color) => {
    const { data, error } = await supabase
        .from('categories')
        .update({ name, color })
        .eq('id', categoryId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const deleteCategory = async (userId, categoryId) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
};
