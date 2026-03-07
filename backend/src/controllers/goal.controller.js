import * as goalService from '../services/goal.service.js';

export const getGoals = async (req, res, next) => {
    try {
        const goals = await goalService.getGoals(req.user.id);
        res.status(200).json({ success: true, count: goals.length, data: goals });
    } catch (error) {
        next(error);
    }
};

export const createGoal = async (req, res, next) => {
    try {
        const goal = await goalService.createGoal(req.user.id, req.body);
        res.status(201).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

export const updateGoal = async (req, res, next) => {
    try {
        const goal = await goalService.updateGoal(req.user.id, req.params.id, req.body);
        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

export const deleteGoal = async (req, res, next) => {
    try {
        await goalService.deleteGoal(req.user.id, req.params.id);
        res.status(200).json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        next(error);
    }
};
