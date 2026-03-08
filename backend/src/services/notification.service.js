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
