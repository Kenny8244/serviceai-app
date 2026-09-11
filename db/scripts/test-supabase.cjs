const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../../worker/.dev.vars') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const CONFIG_HINT =
  'Copy worker/.dev.vars.example → worker/.dev.vars and set SUPABASE_URL + SUPABASE_ANON_KEY (Worker vars; not VITE_*).';

function isPlaceholder(value) {
  return !value || /your-supabase|your-project-ref|replace-with/i.test(value);
}

// Prefer Worker SUPABASE_* names; VITE_* is legacy-only fallback.
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

console.log('Testing Supabase connection...');
console.log('URL set:', Boolean(supabaseUrl) && !isPlaceholder(supabaseUrl));
console.log('Key exists:', Boolean(supabaseKey) && !isPlaceholder(supabaseKey));

if (!supabaseUrl || !supabaseKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseKey)) {
  console.error('Missing or placeholder SUPABASE_URL / SUPABASE_ANON_KEY.');
  console.error(CONFIG_HINT);
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
