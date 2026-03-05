import express from 'express';
import { getDashboardStats } from '../controllers/stats.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getDashboardStats);

export default router;
