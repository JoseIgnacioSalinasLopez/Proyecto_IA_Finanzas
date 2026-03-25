/**
 * ICS Utility
 * Genera el formato de calendario estándar para transacciones financieras.
 */

export const generateICS = (transactions) => {
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LanaTrix//Financial Tracking//ES',
        'X-WR-CALNAME:LanaTrix: Finanzas',
        'X-WR-TIMEZONE:America/Mexico_City',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${tx.id}@lanatrix.com`);
        icsContent.push(`DTSTAMP:${dateStr}`);
        icsContent.push(`DTSTART:${dateStr}`);
        icsContent.push(`DURATION:PT1H`);
        icsContent.push(`SUMMARY:${tx.type === 'income' ? '➕' : '➖'} ${tx.description || tx.categories?.name || 'Transacción'}`);
        icsContent.push(`DESCRIPTION:Monto: $${tx.amount}\\nCategoría: ${tx.categories?.name || 'Sin categoría'}\\nTipo: ${tx.type}`);
        icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
};
