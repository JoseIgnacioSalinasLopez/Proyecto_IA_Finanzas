import * as profileService from '../services/profile.service.js';
import { supabase } from '../config/supabaseClient.js';
import { logActivity } from '../services/activity.service.js';

export const updateProfile = async (req, res, next) => {
    try {
        const updatedUser = await profileService.updateProfile(req.user.id, req.body);
        await logActivity(req.user.id, 'PROFILE_UPDATE', 'Basic info updated', req.ip);
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
};

export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.user.id;
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Subir a Supabase usando Service Role Key (ya configurado en el cliente del backend)
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Actualizar el perfil del usuario con la nueva URL
        const updatedUser = await profileService.updateProfile(userId, { avatar_url: publicUrl });
        await logActivity(userId, 'AVATAR_UPLOAD', 'New avatar uploaded', req.ip);

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
};
