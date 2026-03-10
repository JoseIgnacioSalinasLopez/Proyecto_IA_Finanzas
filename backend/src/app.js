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
import notificationRoutes from './routes/notification.routes.js';


const app = express();

// Middlewares
app.use(cors());

// MODIFICACIÓN PREVENTIVA: Aumentamos el límite a 10mb para que los 
// historiales largos de la IA y los RAGs no colapsen el servidor.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('dev'));

// Routes (Intactas)
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
app.use('/api/notifications', notificationRoutes);


// Healthcheck Route (Intacta)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Mente Billete API is running' });
});

// Centralized Error Handling Middlewares (Intacto)
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