import { supabase } from '../config/supabaseClient.js';
import { createNotification } from './notification.service.js';
import { hashPassword } from '../utils/hashPassword.js';

export const updateProfile = async (userId, dataPayload) => {
    const { name, email, password, account_type, phone, bio, avatar_url } = dataPayload;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (account_type) updates.account_type = account_type;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (password) {
        updates.password = await hashPassword(password);
    }

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, name, email, account_type, created_at, phone, bio, avatar_url')
        .single();

    if (error) throw new Error(error.message);

    await createNotification(
        userId,
        'Perfil Actualizado',
        'Tu información de seguridad o datos personales han sido actualizados',
        'info'
    );

    return data;
};
