import express from 'express';
import { updateProfile, uploadAvatar } from '../controllers/profile.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.route('/')
    .put(protect, updateProfile);

router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
