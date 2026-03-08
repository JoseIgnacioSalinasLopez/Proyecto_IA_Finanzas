import * as budgetService from '../services/budget.service.js';

export const getBudgets = async (req, res, next) => {
    try {
        const budgets = await budgetService.getBudgets(req.user.id);
        res.status(200).json({ success: true, data: budgets });
    } catch (error) {
        next(error);
    }
};

export const upsertBudget = async (req, res, next) => {
    try {
        const budget = await budgetService.upsertBudget(req.user.id, req.body);
        res.status(200).json({ success: true, data: budget });
    } catch (error) {
        next(error);
    }
};

export const deleteBudget = async (req, res, next) => {
    try {
        await budgetService.deleteBudget(req.user.id, req.params.id);
        res.status(200).json({ success: true, message: 'Presupuesto eliminado' });
    } catch (error) {
        next(error);
    }
};
