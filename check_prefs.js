
const https = require('https');

const SUPABASE_URL = 'jdojgsvtmsxfntrtulhx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb2pnc3Z0bXN4Zm50cnR1bGh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzOTU5NCwiZXhwIjoyMDg4MjE1NTk0fQ.NKZg97bG-p5122iu0NzkaN7vROYuq7x_8BA8rPaqeEc';

const options = {
    hostname: SUPABASE_URL,
    path: '/rest/v1/user_preferences?limit=1',
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation'
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('DATA:', body);
    });
});

req.on('error', (err) => {
    console.error('❌ Error:', err.message);
});

req.end();
