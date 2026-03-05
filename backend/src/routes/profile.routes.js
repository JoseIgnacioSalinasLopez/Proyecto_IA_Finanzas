import express from 'express';
import { updateProfile } from '../controllers/profile.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .put(protect, updateProfile);

export default router;
