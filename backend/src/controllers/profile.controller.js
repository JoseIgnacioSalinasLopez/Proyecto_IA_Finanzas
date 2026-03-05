import * as profileService from '../services/profile.service.js';

export const updateProfile = async (req, res, next) => {
    try {
        const updatedUser = await profileService.updateProfile(req.user.id, req.body);
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
};
