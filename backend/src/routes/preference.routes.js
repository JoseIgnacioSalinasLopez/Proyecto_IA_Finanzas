import express from 'express';
import { getPreferences, updatePreferences } from '../controllers/preference.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getPreferences);
router.put('/', updatePreferences);

export default router;
