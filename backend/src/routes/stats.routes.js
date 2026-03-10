import express from 'express';
import { getDashboardStats } from '../controllers/stats.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/', protect, getDashboardStats);

export default router;
