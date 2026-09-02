const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../../worker/.dev.vars') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim();

const CORE_TABLES = [
    'tenants',
    'workspaces',
    'schemas',
    'object_types',
    'objects',
    'profiles',
    'user_workspace_roles',
    'object_relations',
    'stock_transactions',
    'service_requests',
    'attachments',
    'audit_logs',
];

const EXPECTED_OBJECT_TYPES = ['asset', 'location', 'supplier', 'equipment', 'inventory_item'];

async function checkDatabase() {
    console.log('Checking database status...\n');

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing SUPABASE_URL / keys in worker/.dev.vars (or db/.env)');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let failed = false;

    console.log('Core tables:');
    for (const table of CORE_TABLES) {
        const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
        if (error) {
            failed = true;
            console.log(`   FAIL ${table}: ${error.message}`);
        } else {
            console.log(`   OK   ${table}`);
        }
    }

    console.log('\nView asset_inventory:');
    {
        const { error } = await supabase.from('asset_inventory').select('*', { head: true, count: 'exact' });
        if (error) {
            failed = true;
            console.log(`   FAIL ${error.message}`);
        } else {
            console.log('   OK   asset_inventory');
        }
    }

    console.log('\nTenants:');
    {
        const { data, error } = await supabase.from('tenants').select('tenant_id, name, status');
        if (error) {
            failed = true;
            console.log(`   FAIL ${error.message}`);
        } else if (!data || data.length === 0) {
            failed = true;
            console.log('   FAIL none found (expected Default Tenant bootstrap)');
        } else {
            data.forEach((tenant) => console.log(`   OK   ${tenant.name} (${tenant.status})`));
        }
    }

    console.log('\nWorkspaces:');
    {
        const { data, error } = await supabase.from('workspaces').select('workspace_id, name, tenant_id');
        if (error) {
            failed = true;
            console.log(`   FAIL ${error.message}`);
        } else if (!data || data.length === 0) {
            failed = true;
            console.log('   FAIL none found (expected Default Workspace bootstrap)');
        } else {
            data.forEach((workspace) => console.log(`   OK   ${workspace.name}`));
        }
    }

    console.log('\nObject types:');
    {
        const { data, error } = await supabase.from('object_types').select('object_type_id, name, is_system');
        if (error) {
            failed = true;
            console.log(`   FAIL ${error.message}`);
        } else {
            const names = (data || []).map((row) => row.name);
            EXPECTED_OBJECT_TYPES.forEach((name) => {
                if (names.includes(name)) {
                    console.log(`   OK   ${name} (system)`);
                } else {
                    failed = true;
                    console.log(`   FAIL missing system type: ${name}`);
                }
            });
        }
    }

    console.log('\nAuth profile columns (SCRUM-69):');
    {
        const { error } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone_number, job_title', { head: true, count: 'exact' });
        if (error) {
            failed = true;
            console.log(`   FAIL profiles extra columns: ${error.message}`);
            console.log('         Apply db/migrations/20260902000000_auth_profile_fields.sql');
        } else {
            console.log('   OK   profiles.first_name / last_name / phone_number / job_title');
        }
    }
    {
        const { error } = await supabase
            .from('tenants')
            .select('company_size, industry', { head: true, count: 'exact' });
        if (error) {
            failed = true;
            console.log(`   FAIL tenants extra columns: ${error.message}`);
            console.log('         Apply db/migrations/20260902000000_auth_profile_fields.sql');
        } else {
            console.log('   OK   tenants.company_size / industry');
        }
    }
    console.log('\nProfiles:');
    {
        const { data, error, count } = await supabase
            .from('profiles')
            .select('id, email, full_name', { count: 'exact' });
        if (error) {
            failed = true;
            console.log(`   FAIL ${error.message}`);
        } else {
            const n = count ?? data?.length ?? 0;
            console.log(`   OK   ${n} profile(s) (empty until a user signs up)`);
            (data || []).slice(0, 5).forEach((profile) => {
                console.log(`         ${profile.email || profile.id}`);
            });
        }
    }

    console.log('\nObjects / service_requests:');
    {
        const objects = await supabase.from('objects').select('object_id', { count: 'exact', head: true });
        const tickets = await supabase.from('service_requests').select('ticket_id', { count: 'exact', head: true });
        if (objects.error) {
            failed = true;
            console.log(`   FAIL objects: ${objects.error.message}`);
        } else {
            console.log(`   OK   objects: ${objects.count ?? 0}`);
        }
        if (tickets.error) {
            failed = true;
            console.log(`   FAIL service_requests: ${tickets.error.message}`);
        } else {
            console.log(`   OK   service_requests: ${tickets.count ?? 0}`);
        }
    }

    if (failed) {
        console.log('\nDatabase check failed. Apply db/migrations/20240207000000_complete_setup.sql');
        console.log('then db/migrations/20260902000000_auth_profile_fields.sql in the SQL Editor.');
        process.exit(1);
    }

    console.log('\nDatabase check passed.');
}

checkDatabase().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
