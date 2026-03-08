import { supabase } from '../config/supabaseClient.js';

export const getPreferences = async (userId) => {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
};

export const updatePreferences = async (userId, dataPayload) => {
    const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: userId,
            ...dataPayload
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Supabase Upsert Error:', error);
        throw new Error(error.message);
    }
    return data;
};
