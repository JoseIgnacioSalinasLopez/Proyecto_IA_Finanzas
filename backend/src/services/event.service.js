import { supabase } from '../config/supabaseClient.js';

export const getEvents = async (userId) => {
    const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
};

export const createEvent = async (userId, eventData) => {
    const { data, error } = await supabase
        .from('timeline_events')
        .insert([{ ...eventData, user_id: userId }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const updateEvent = async (userId, eventId, eventData) => {
    const { data, error } = await supabase
        .from('timeline_events')
        .update(eventData)
        .eq('id', eventId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const deleteEvent = async (userId, eventId) => {
    const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
};
