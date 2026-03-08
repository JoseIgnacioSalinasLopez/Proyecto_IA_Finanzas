import * as preferenceService from '../services/preference.service.js';

export const getPreferences = async (req, res, next) => {
    try {
        const prefs = await preferenceService.getPreferences(req.user.id);
        res.status(200).json({ success: true, data: prefs });
    } catch (error) {
        next(error);
    }
};

export const updatePreferences = async (req, res, next) => {
    try {
        const prefs = await preferenceService.updatePreferences(req.user.id, req.body);
        res.status(200).json({ success: true, data: prefs });
    } catch (error) {
        next(error);
    }
};
