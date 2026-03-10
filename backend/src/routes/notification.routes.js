import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-read', markAsRead);

export default router;
