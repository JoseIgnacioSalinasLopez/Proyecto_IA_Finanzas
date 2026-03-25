import { registerUser, loginUser, updatePassword } from '../services/auth.service.js';
import * as profileService from '../services/profile.service.js';
import { generateToken } from '../utils/generateToken.js';
import { supabase } from '../config/supabaseClient.js';
import { seedDefaultCategories } from '../services/category.service.js';
import { logActivity } from '../services/activity.service.js';

export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all fields' });
        }

        const user = await registerUser(name, email, password);
        await logActivity(user.id, 'REGISTER', 'User created account', req.ip);
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            success: true,
            data: {
                ...userWithoutPassword,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        next({ status: 400, message: error.message });
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await loginUser(email, password);
        await logActivity(user.id, 'LOGIN', 'User logged in', req.ip);
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({
            success: true,
            data: {
                ...userWithoutPassword,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        next({ status: 401, message: error.message });
    }
};

export const googleLogin = async (req, res, next) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            console.warn('[GoogleLogin] Attempt without email');
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Buscar si existe usando maybeSingle para evitar errores si no se encuentra
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (findError) {
            console.error('[GoogleLogin] Error finding user:', findError);
            throw new Error('Error searching for user in database');
        }

        let user = existingUser;

        if (!user) {
            console.log(`[GoogleLogin] Creating new Google user: ${email} `);
            // Crear usuario con password placeholder
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{
                    name: name || email.split('@')[0],
                    email,
                    password: 'google_auth_user',
                    account_type: 'standard'
                }])
                .select()
                .single();

            if (insertError) {
                // Si falla por duplicado, es que alguien (otra petición concurrente) lo creó justo ahora
                if (insertError.code === '23505') {
                    const { data: retryUser } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', email)
                        .maybeSingle();
                    user = retryUser;
                }

                if (!user) {
                    console.error('[GoogleLogin] Error creating user:', insertError);
                    throw new Error('Could not create Google user: ' + insertError.message);
                }
            } else {
                user = newUser;
                // Seed default categories for new user
                await seedDefaultCategories(user.id);
            }
        }

        await logActivity(user.id, 'LOGIN_GOOGLE', 'User logged in via Google', req.ip);
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({
            success: true,
            data: {
                ...userWithoutPassword,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        console.error('[GoogleLogin] Fatal error:', error);
        next({ status: 400, message: error.message });
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }

        await updatePassword(req.user.id, currentPassword, newPassword);
        await logActivity(req.user.id, 'PASSWORD_CHANGE', 'Password updated', req.ip);

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next({ status: 400, message: error.message });
    }
};

export const getMe = async (req, res, next) => {
    try {
        // req.user is set in auth middleware
        res.status(200).json({
            success: true,
            data: req.user,
        });
    } catch (error) {
        next(error);
    }
};
