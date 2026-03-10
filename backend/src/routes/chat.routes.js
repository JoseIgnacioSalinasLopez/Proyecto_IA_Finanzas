import express from 'express';
import {
    chat,
    getHistory,
    getSessions,
    createSession,
    deleteSession
} from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/sessions', protect, getSessions);
router.post('/sessions', protect, createSession);
router.delete('/sessions/:id', protect, deleteSession);
router.get('/history/:sessionId', protect, getHistory);
router.get('/', protect, getHistory); // Fallback
router.post('/', protect, chat);

export default router;
