import express from 'express';
// AQUÍ ESTABA EL ERROR: Faltaba importar clearHistory
import { chat, getHistory, clearHistory } from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getHistory);
router.post('/', protect, chat);
router.delete('/', protect, clearHistory);

export default router;