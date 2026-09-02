const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../../worker/.dev.vars') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

console.log('Testing Supabase connection...');
console.log('URL set:', Boolean(supabaseUrl));
console.log('Key exists:', Boolean(supabaseKey));

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY in worker/.dev.vars (or db/.env)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Testing basic connection...');

        const { error } = await supabase.from('tenants').select('count').limit(1);

        if (error) {
            console.error('Connection failed:', error.message);
            process.exit(1);
        }

        console.log('Connected to Supabase.');
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

testConnection();
