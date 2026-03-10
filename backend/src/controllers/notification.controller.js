import * as notificationService from '../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.id);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        await notificationService.markAsRead(req.user.id);
        res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        next(error);
    }
};
