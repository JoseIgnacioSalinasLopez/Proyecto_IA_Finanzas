import { supabase } from '../config/supabaseClient.js';

export const logActivity = async (userId, action, details = '', ip = '') => {
    try {
        const { error } = await supabase
            .from('activity_logs')
            .insert([{
                user_id: userId,
                action,
                details,
                ip_address: ip
            }]);

        if (error) {
            console.error('[ActivityLog] Error inserting log:', error);
        }
    } catch (error) {
        console.error('[ActivityLog] Fatal error:', error);
    }
};

export const getUserActivities = async (userId, limit = 10) => {
    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
};
