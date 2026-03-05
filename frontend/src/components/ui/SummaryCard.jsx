import React from 'react';

export default function SummaryCard({ title, amount, icon, type }) {
    const getColors = () => {
        switch (type) {
            case 'income':
                return 'text-finance-primary bg-finance-primary/10';
            case 'expense':
                return 'text-finance-danger bg-finance-danger/10';
            case 'balance':
                return 'text-[#4F46E5] bg-[#4F46E5]/10';
            default:
                return 'text-finance-muted bg-finance-muted/10';
        }
    };

    const formattedAmount = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(amount || 0);

    return (
        <div className="card flex items-center p-6 bg-finance-800 rounded-xl shadow border border-finance-700">
            <div className={`p-4 rounded-full mr-4 ${getColors()}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-medium text-finance-muted mb-1">{title}</h3>
                <p className={`text-2xl font-bold ${amount >= 0 ? '' : 'text-finance-danger'}`}>
                    {formattedAmount}
                </p>
            </div>
        </div>
    );
}
