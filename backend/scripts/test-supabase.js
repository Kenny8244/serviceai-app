const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Anon Key in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Test basic connection
        console.log('🔄 Testing basic connection...');
        
        // Try to access the database
        const { data, error } = await supabase
            .from('tenants')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Connection failed:');
            console.error('Error:', error);
            
            if (error.message.includes('relation "tenants" does not exist')) {
                console.log('\n💡 Solution: Run the migration script first');
                console.log('   1. Go to Supabase SQL Editor');
                console.log('   2. Run the complete_setup.sql migration');
            } else if (error.message.includes('permission denied')) {
                console.log('\n💡 Solution: Check RLS policies or use service role key');
            }
            
            return;
        }

        console.log('✅ Successfully connected to Supabase!');
        console.log('Data:', data);

        // Test if tables exist
        console.log('\n🔍 Checking tables...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['tenants', 'workspaces', 'objects', 'users']);

        if (tablesError) {
            console.log('   ⚠️  Cannot check tables (might need service role key)');
        } else {
            console.log(`   Found ${tables?.length || 0} core tables`);
        }

    } catch (err) {
        console.error('❌ Unexpected error:');
        console.error(err);
    }
}

testConnection();
