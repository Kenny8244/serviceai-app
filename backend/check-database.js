const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Checking database status...\n');

    try {
        // Check tables
        console.log('📋 Tables:');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');

        if (tablesError) {
            console.log('   ❌ Cannot check tables:', tablesError.message);
        } else {
            tables.forEach(table => {
                console.log(`   ✅ ${table.table_name}`);
            });
        }

        // Check tenants
        console.log('\n🏢 Tenants:');
        const { data: tenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('tenant_id, name, status, created_at');

        if (tenantsError) {
            console.log('   ❌ Error:', tenantsError.message);
        } else {
            tenants.forEach(tenant => {
                console.log(`   ✅ ${tenant.name} (${tenant.status})`);
            });
        }

        // Check workspaces
        console.log('\n🏢 Workspaces:');
        const { data: workspaces, error: workspacesError } = await supabase
            .from('workspaces')
            .select('workspace_id, name, tenant_id');

        if (workspacesError) {
            console.log('   ❌ Error:', workspacesError.message);
        } else {
            workspaces.forEach(workspace => {
                console.log(`   ✅ ${workspace.name}`);
            });
        }

        // Check users
        console.log('\n👥 Users:');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('user_id, email, role, is_active');

        if (usersError) {
            console.log('   ❌ Error:', usersError.message);
        } else {
            users.forEach(user => {
                console.log(`   ✅ ${user.email} (${user.role}) - Active: ${user.is_active}`);
            });
        }

        // Check objects
        console.log('\n📦 Objects:');
        const { data: objects, error: objectsError } = await supabase
            .from('objects')
            .select('object_id, name, status');

        if (objectsError) {
            console.log('   ❌ Error:', objectsError.message);
        } else {
            console.log(`   ✅ Found ${objects.length} objects`);
            objects.slice(0, 3).forEach(obj => {
                console.log(`      - ${obj.name} (${obj.status})`);
            });
            if (objects.length > 3) {
                console.log(`      ... and ${objects.length - 3} more`);
            }
        }

        // Check object types
        console.log('\n🏷️  Object Types:');
        const { data: objectTypes, error: objectTypesError } = await supabase
            .from('object_types')
            .select('object_type_id, name, is_system');

        if (objectTypesError) {
            console.log('   ❌ Error:', objectTypesError.message);
        } else {
            objectTypes.forEach(type => {
                const system = type.is_system ? ' (system)' : '';
                console.log(`   ✅ ${type.name}${system}`);
            });
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkDatabase();
