const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../../worker/.dev.vars') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const CONFIG_HINT =
  'Copy worker/.dev.vars.example → worker/.dev.vars and set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY). Prefer Worker SUPABASE_* names, not VITE_*.';

function isPlaceholder(value) {
  return !value || /your-supabase|your-project-ref|replace-with/i.test(value);
}

// Prefer Worker SUPABASE_* names; VITE_* is legacy-only fallback.
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

const CORE_TABLES = [
    'tenants',
    'workspaces',
    'schemas',
    'object_types',
    'object_type_attributes',
    'objects',
    'profiles',
    'user_workspace_roles',
    'object_relations',
    'stock_transactions',
    'service_requests',
    'attachments',
    'audit_logs',
];

const EXPECTED_OBJECT_TYPES = ['Freezer', 'Product', 'Equipment', 'Ingredient'];

const EXPECTED_ATTRIBUTES = {
    Product: ['sku', 'quantity', 'min_quantity', 'unit_cost', 'supplier', 'location'],
    Ingredient: ['quantity', 'unit', 'min_quantity', 'location', 'perishable'],
    Equipment: ['location', 'supplier', 'serial_number'],
    Freezer: ['location', 'temperature', 'capacity'],
};

async function checkDatabase() {
    console.log('Checking database status...\n');

    if (!supabaseUrl || !supabaseKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseKey)) {
        console.error('Missing or placeholder SUPABASE_URL / keys.');
        console.error(CONFIG_HINT);
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let failed = false;

    console.log('Core tables:');
    for (const table of CORE_TABLES) {
        const { error } = await supabase.from(table).select('*').limit(1);
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
                    console.log(`   OK   ${name}`);
                } else {
                    failed = true;
                    console.log(`   FAIL missing object type: ${name}`);
                }
            });
        }
    }

    console.log('\nObject type attributes (SCRUM-34):');
    {
        const types = await supabase.from('object_types').select('object_type_id, name');
        const attrs = await supabase.from('object_type_attributes').select('object_type_id, name');
        if (attrs.error) {
            failed = true;
            console.log(`   FAIL ${attrs.error.message}`);
            console.log('         Apply db/migrations/20260909120000_scrum34_object_type_attributes.sql');
        } else if (types.error) {
            failed = true;
            console.log(`   FAIL ${types.error.message}`);
        } else {
            const typeNames = new Map((types.data || []).map((row) => [row.object_type_id, row.name]));
            const byType = {};
            (attrs.data || []).forEach((row) => {
                const typeName = typeNames.get(row.object_type_id);
                if (!typeName) return;
                if (!byType[typeName]) byType[typeName] = [];
                byType[typeName].push(row.name);
            });
            Object.entries(EXPECTED_ATTRIBUTES).forEach(([typeName, expected]) => {
                const names = byType[typeName] || [];
                const missing = expected.filter((name) => !names.includes(name));
                if (missing.length === 0) {
                    console.log(`   OK   ${typeName}: ${expected.join(', ')}`);
                } else {
                    failed = true;
                    console.log(`   FAIL ${typeName} missing attributes: ${missing.join(', ')}`);
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

    console.log('\nService request model (SCRUM-43):');
    {
        const { error } = await supabase
            .from('service_requests')
            .select(
                'ticket_id, workspace_id, title, description, category, priority, status, related_asset_object_id, created_at, updated_at',
                { head: true, count: 'exact' }
            );
        if (error) {
            failed = true;
            console.log(`   FAIL AC columns: ${error.message}`);
            console.log('         Apply db/migrations/20260914160000_scrum43_service_request_model.sql');
        } else {
            console.log(
                '   OK   title / category / related_asset_object_id / workspace_id / priority / status / timestamps'
            );
        }
    }

    console.log('\nRow Level Security (SCRUM-29):');
    {
        const { data, error } = await supabase.rpc('check_core_rls_status');
        if (error) {
            failed = true;
            console.log(`   FAIL ${error.message}`);
            console.log('         Apply db/migrations/20260911000000_tenant_rls.sql');
        } else {
            const rows = data || [];
            const missing = CORE_TABLES.filter((name) => !rows.some((row) => row.table_name === name));
            missing.forEach((name) => {
                failed = true;
                console.log(`   FAIL ${name}: not reported by check_core_rls_status`);
            });
            rows.forEach((row) => {
                if (!row.rls_enabled || row.policy_count < 1) {
                    failed = true;
                    console.log(
                        `   FAIL ${row.table_name}: rls=${row.rls_enabled} policies=${row.policy_count}`
                    );
                } else {
                    console.log(`   OK   ${row.table_name}: RLS on, ${row.policy_count} polic(y/ies)`);
                }
            });
        }
    }

    if (failed) {
        console.log('\nDatabase check failed. Apply db/migrations/20240207000000_complete_setup.sql');
        console.log('then db/migrations/20260902000000_auth_profile_fields.sql');
        console.log('then db/migrations/20260909000000_scrum33_object_type_seed.sql');
        console.log('then db/migrations/20260909120000_scrum34_object_type_attributes.sql');
        console.log('then db/migrations/20260911000000_tenant_rls.sql in the SQL Editor.');
        console.log('then db/migrations/20260914160000_scrum43_service_request_model.sql');
        console.log('After RLS: npm run db:rls-test');
        process.exit(1);
    }

    console.log('\nDatabase check passed.');
}

checkDatabase().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
