import express from 'express';
import { chat, getHistory } from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.get('/', protect, getHistory);
router.post('/', protect, chat);

export default router;
