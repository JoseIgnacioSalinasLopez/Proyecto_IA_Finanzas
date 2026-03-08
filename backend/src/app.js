import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import statsRoutes from './routes/stats.routes.js';
import profileRoutes from './routes/profile.routes.js';
import goalRoutes from './routes/goal.routes.js';
import eventRoutes from './routes/event.routes.js';
import chatRoutes from './routes/chat.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import preferenceRoutes from './routes/preference.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/preferences', preferenceRoutes);

// Healthcheck Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Mente Billete API is running' });
});

// Centralized Error Handling Middlewares
app.use((err, req, res, next) => {
    console.error('EXPRESS ERROR CAUGHT:', err);
    console.error('Stack:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        details: err.details || null
    });
});

export default app;
