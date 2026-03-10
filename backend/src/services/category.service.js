import { supabase } from '../config/supabaseClient.js';
import { createNotification } from './notification.service.js';

export const getCategories = async (userId) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data;
};

export const createCategory = async (userId, name, color, type = 'expense', is_editable = true) => {
    const { data, error } = await supabase
        .from('categories')
        .insert([{ user_id: userId, name, color, type, is_editable }])
        .select()
        .single();

    if (error) throw new Error(error.message);

    await createNotification(
        userId,
        'Nueva Categoría Creada',
        `Has creado la categoría: ${name} (${type === 'income' ? 'Ingreso' : 'Gasto'})`,
        'success'
    );

    return data;
};

export const updateCategory = async (userId, categoryId, name, color) => {
    // Check if editable
    const { data: category } = await supabase
        .from('categories')
        .select('is_editable')
        .eq('id', categoryId)
        .single();

    if (category && !category.is_editable) {
        throw new Error('Esta categoría es del sistema y no se puede editar');
    }

    const { data, error } = await supabase
        .from('categories')
        .update({ name, color })
        .eq('id', categoryId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);

    await createNotification(
        userId,
        'Categoría Modificada',
        `Has actualizado la categoría a: ${name}`,
        'info'
    );

    return data;
};

export const deleteCategory = async (userId, categoryId) => {
    // Check if editable
    const { data: category } = await supabase
        .from('categories')
        .select('is_editable')
        .eq('id', categoryId)
        .single();

    if (category && !category.is_editable) {
        throw new Error('Esta categoría es del sistema y no se puede eliminar');
    }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);

    await createNotification(
        userId,
        'Categoría Eliminada',
        'Has eliminado una categoría de tus registros',
        'alert'
    );

    return true;
};

export const seedDefaultCategories = async (userId) => {
    const defaults = [
        // Gastos
        { name: 'Comida', color: '#ef4444', type: 'expense', is_editable: false },
        { name: 'Renta', color: '#4F46E5', type: 'expense', is_editable: false },
        { name: 'Servicios', color: '#10b981', type: 'expense', is_editable: false },
        { name: 'Transporte', color: '#f59e0b', type: 'expense', is_editable: false },
        { name: 'Entretenimiento', color: '#8b5cf6', type: 'expense', is_editable: false },
        { name: 'Salud', color: '#ec4899', type: 'expense', is_editable: false },
        { name: 'Educación', color: '#06b6d4', type: 'expense', is_editable: false },
        { name: 'Otros Gastos', color: '#94a3b8', type: 'expense', is_editable: false },
        // Ingresos
        { name: 'Sueldo', color: '#22c55e', type: 'income', is_editable: false },
        { name: 'Inversiones', color: '#3b82f6', type: 'income', is_editable: false },
        { name: 'Ventas', color: '#f97316', type: 'income', is_editable: false },
        { name: 'Otros Ingresos', color: '#64748b', type: 'income', is_editable: false }
    ];

    const categoriesToInsert = defaults.map(cat => ({
        ...cat,
        user_id: userId
    }));

    const { error } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

    if (error) {
        console.error('Error seeding categories:', error.message);
        return false;
    }

    return true;
};
