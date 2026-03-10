import { registerUser } from './src/services/auth.service.js';
import { getCategories } from './src/services/category.service.js';
import { createTransaction } from './src/services/transaction.service.js';
import { upsertBudget } from './src/services/budget.service.js';
import { createGoal } from './src/services/goal.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
    console.log('--- START SEEDING DEMO USER ---');
    try {
        // 1. Register User
        const email = `demo_user_${Date.now()}@example.com`;
        const user = await registerUser('Demo User', email, 'password123');
        console.log(`User registered: ${user.name} (${user.email}) ID: ${user.id}`);

        // 2. Get categories (seeded by registerUser)
        const categories = await getCategories(user.id);
        const catMap = {};
        categories.forEach(c => catMap[c.name] = c.id);

        console.log('Categories found:', categories.length);

        // 3. Transactions (Income)
        console.log('Inserting transactions...');
        await createTransaction(user.id, {
            amount: 25000,
            type: 'income',
            category_id: catMap['Sueldo'],
            description: 'Sueldo Mensual',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        });

        await createTransaction(user.id, {
            amount: 2000,
            type: 'income',
            category_id: catMap['Ventas'],
            description: 'Venta de artículos usados',
            date: new Date().toISOString()
        });

        // 4. Transactions (Expenses)
        const expenses = [
            { name: 'Renta', amt: 8000, desc: 'Renta Departamento' },
            { name: 'Comida', amt: 1200, desc: 'Súper Quincena' },
            { name: 'Comida', amt: 450, desc: 'Cena Restaurante' },
            { name: 'Transporte', amt: 1500, desc: 'Gasolina' },
            { name: 'Servicios', amt: 600, desc: 'Luz y Agua' },
            { name: 'Entretenimiento', amt: 199, desc: 'Netflix' },
            { name: 'Salud', amt: 850, desc: 'Farmacia' },
        ];

        for (const exp of expenses) {
            await createTransaction(user.id, {
                amount: exp.amt,
                type: 'expense',
                category_id: catMap[exp.name],
                description: exp.desc,
                date: new Date().toISOString()
            });
        }

        // 5. Budgets
        console.log('Setting up budgets...');
        await upsertBudget(user.id, { category_id: catMap['Comida'], amount_limit: 4000 });
        await upsertBudget(user.id, { category_id: catMap['Entretenimiento'], amount_limit: 1000 });
        await upsertBudget(user.id, { category_id: catMap['Transporte'], amount_limit: 2500 });

        // 6. Goals
        console.log('Creating goals...');
        await createGoal(user.id, {
            name: 'Viaje a Japón',
            target_amount: 50000,
            current_amount: 5000,
            deadline: '2026-12-31'
        });

        console.log('\n--- SEEDING COMPLETE ---');
        console.log(`Email: ${email}`);
        console.log('Password: password123');

    } catch (e) {
        console.error('Error seeding:', e);
    }
    process.exit(0);
}

seed();
