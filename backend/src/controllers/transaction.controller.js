import * as transactionService from '../services/transaction.service.js';

export const getTransactions = async (req, res, next) => {
    try {
        const transactions = await transactionService.getTransactions(req.user.id, req.query);
        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        next(error);
    }
};

export const createTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.createTransaction(req.user.id, req.body);
        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
};

export const updateTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);
        res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
};

export const deleteTransaction = async (req, res, next) => {
    try {
        await transactionService.deleteTransaction(req.user.id, req.params.id);
        res.status(200).json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
        next(error);
    }
};
