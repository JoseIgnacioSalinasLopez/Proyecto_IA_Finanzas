import express from 'express';
import { register, login, googleLogin, getMe, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

export default router;
