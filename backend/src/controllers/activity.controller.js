import * as activityService from '../services/activity.service.js';

export const getMyActivities = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            console.error('[ActivityController] No user ID found in request');
            return res.status(401).json({ success: false, message: 'Unauthorized: No user found' });
        }
        console.log(`[ActivityController] Fetching activities for user: ${req.user.id}`);
        const activities = await activityService.getUserActivities(req.user.id);
        res.status(200).json({ success: true, data: activities });
    } catch (error) {
        console.error('[ActivityController] Error in getMyActivities:', error);
        next(error);
    }
};
