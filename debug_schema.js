
const https = require('https');

const SUPABASE_URL = 'jdojgsvtmsxfntrtulhx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2pnc3Z0bXN4Zm50cnR1bGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzOTU5NCwiZXhwIjoyMDg4MjE1NTk0fQ.NKZg97bG-p5122iu0NzkaN7vROYuq7x_8BA8rPaqeEc';

const options = {
    hostname: SUPABASE_URL,
    path: '/rest/v1/', // Root to see tables if possible or just try to get one row and look at keys
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
    }
};

// Let's try to get the schema of user_preferences via OpenAPI spec that Supabase provides
const schemaOptions = {
    ...options,
    path: '/rest/v1/?apikey=' + SUPABASE_KEY
};

https.get(schemaOptions, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const schema = JSON.parse(body);
            const table = schema.definitions.user_preferences;
            if (table) {
                console.log('COLUMNS:', Object.keys(table.properties).join(', '));
            } else {
                console.log('Table not found in OpenAPI spec');
            }
        } catch (e) {
            console.log('ERROR PARSING:', e.message);
            // Fallback: try to just query the table and see what comes back in an error or empty result
        }
    });
});
