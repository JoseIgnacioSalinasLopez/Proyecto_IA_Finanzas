import { supabase } from '../config/supabaseClient.js';
import { hashPassword, matchPassword } from '../utils/hashPassword.js';
import { seedDefaultCategories } from './category.service.js';

export const registerUser = async (name, email, password) => {
    // Check if user exists
    const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (userExists) {
        throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);

    const { data: user, error } = await supabase
        .from('users')
        .insert([{ name, email, password: hashedPassword }])
        .select()
        .single();

    if (error) {
        throw new Error('Invalid user data: ' + error.message);
    }

    // Seed default categories
    await seedDefaultCategories(user.id);

    return user;
};

export const loginUser = async (email, password) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await matchPassword(password, user.password);

    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    return user;
};
