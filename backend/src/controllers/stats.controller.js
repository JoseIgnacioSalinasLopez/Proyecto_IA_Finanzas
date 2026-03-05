import * as statsService from '../services/stats.service.js';

export const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await statsService.getStats(req.user.id, req.query);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};
