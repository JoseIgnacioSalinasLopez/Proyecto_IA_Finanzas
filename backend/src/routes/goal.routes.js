import express from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goal.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getGoals)
    .post(protect, createGoal);

router.route('/:id')
    .put(protect, updateGoal)
    .delete(protect, deleteGoal);

export default router;
