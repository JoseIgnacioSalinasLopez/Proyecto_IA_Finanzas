import express from 'express';
import {
    chat,
    getHistory,
    getSessions,
    createSession,
    deleteSession,
    clearHistory
} from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/sessions', protect, getSessions);
router.post('/sessions', protect, createSession);
router.delete('/sessions/:id', protect, deleteSession);
router.get('/history/:sessionId', protect, getHistory);
router.get('/', protect, getHistory); 
router.post('/', protect, chat);
router.delete('/', protect, clearHistory);

export default router;