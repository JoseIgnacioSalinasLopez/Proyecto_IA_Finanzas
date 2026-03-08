
const https = require('https');

const SUPABASE_URL = 'jdojgsvtmsxfntrtulhx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2pnc3Z0bXN4Zm50cnR1bGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzOTU5NCwiZXhwIjoyMDg4MjE1NTk0fQ.NKZg97bG-p5122iu0NzkaN7vROYuq7x_8BA8rPaqeEc';

const options = {
    hostname: SUPABASE_URL,
    path: '/rest/v1/?apikey=' + SUPABASE_KEY,
    method: 'GET'
};

https.get(options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const schema = JSON.parse(body);
            const props = schema.definitions.user_preferences.properties;
            console.log('ALL_COLUMNS:', Object.keys(props).join('|'));
        } catch (e) {
            console.log('ERROR:', e.message);
        }
    });
});
