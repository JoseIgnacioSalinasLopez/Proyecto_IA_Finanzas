import express from 'express';
import { getMyActivities } from '../controllers/activity.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getMyActivities);

export default router;
