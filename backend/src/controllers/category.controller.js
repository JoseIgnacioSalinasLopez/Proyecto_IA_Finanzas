import * as categoryService from '../services/category.service.js';

export const updateCategory = async (req, res, next) => {
    try {
        const { name, color } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const category = await categoryService.updateCategory(req.user.id, req.params.id, name, color);
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

export const getCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.getCategories(req.user.id);
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req, res, next) => {
    try {
        const { name, color, type } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const category = await categoryService.createCategory(req.user.id, name, color, type);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.user.id, req.params.id);
        res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
        next(error);
    }
};
