import express from 'express';

// AQUÍ ESTABA EL ERROR: Faltaba importar clearHistory
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

// Rutas de gestión de sesiones
router.get('/sessions', protect, getSessions);
router.post('/sessions', protect, createSession);
router.delete('/sessions/:id', protect, deleteSession);

// Rutas de historial específico
router.get('/history/:sessionId', protect, getHistory);

// Rutas generales del chat
router.get('/', protect, getHistory);
router.post('/', protect, chat);
router.delete('/', protect, clearHistory);

export default router;