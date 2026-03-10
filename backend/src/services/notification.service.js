import { supabase } from '../config/supabaseClient.js';

export const createNotification = async (userId, title, message, type = 'info') => {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                title,
                message,
                type,
                is_read: false
            }]);

        if (error) {
            console.error('Error creating notification:', error.message);
        }
    } catch (err) {
        console.error('Unhandled error creating notification:', err.message);
    }
};
export const getNotifications = async (userId) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

export const markAsRead = async (userId) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw new Error(error.message);
    return true;
};
