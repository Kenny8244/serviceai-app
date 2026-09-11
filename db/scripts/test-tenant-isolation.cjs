/**
 * SCRUM-29: Cross-tenant isolation test.
 *
 * 1. Seeds two tenants/workspaces/users/objects via service_role.
 * 2. Signs in as user A with the anon key and verifies:
 *    - own object SELECT succeeds
 *    - other tenant object SELECT returns empty / fails
 *    - other tenant object UPDATE fails / touches 0 rows
 * 3. Optionally checks Worker GET /api/assets/:id as A for B's object → 404
 *    when API_BASE_URL (default http://127.0.0.1:8787) is reachable.
 * 4. Cleans up seeded rows and auth users.
 *
 * Prerequisites:
 * - Apply db/migrations/20260911000000_tenant_rls.sql
 * - worker/.dev.vars with SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npm run db:rls-test
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../../worker/.dev.vars') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const CONFIG_HINT =
  'Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in worker/.dev.vars.';

function isPlaceholder(value) {
  return !value || /your-supabase|your-project-ref|replace-with/i.test(value);
}

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const apiBase = (process.env.API_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const jwtSecret = (process.env.JWT_SECRET || 'serviceai-dev-secret').trim();

function fail(message) {
  console.error(`FAIL  ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK    ${message}`);
}

function stamp() {
  return Date.now().toString(36);
}

async function cleanup(admin, state) {
  if (!state) return;
  const { objectIds = [], workspaceIds = [], tenantIds = [], userIds = [], schemaIds = [] } = state;

  if (objectIds.length) {
    await admin.from('objects').delete().in('object_id', objectIds);
  }
  if (schemaIds.length) {
    const { data: types } = await admin.from('object_types').select('object_type_id').in('schema_id', schemaIds);
    const typeIds = (types || []).map((row) => row.object_type_id);
    if (typeIds.length) {
      await admin.from('object_type_attributes').delete().in('object_type_id', typeIds);
      await admin.from('object_types').delete().in('object_type_id', typeIds);
    }
    await admin.from('schemas').delete().in('schema_id', schemaIds);
  }
  if (workspaceIds.length) {
    await admin.from('user_workspace_roles').delete().in('workspace_id', workspaceIds);
    await admin.from('workspaces').delete().in('workspace_id', workspaceIds);
  }
  if (tenantIds.length) {
    await admin.from('tenants').delete().in('tenant_id', tenantIds);
  }
  for (const userId of userIds) {
    await admin.from('profiles').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
  }
}

/** Minimal HS256 JWT matching worker/src/lib/jwt.ts shape (for optional API check). */
async function mintAppJwt(payload) {
  const crypto = require('crypto');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      organizationId: payload.organizationId || 'default-org-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  const data = `${header}.${body}`;
  const sig = crypto.createHmac('sha256', jwtSecret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

async function optionalWorkerCheck(userA, objectBId) {
  let health;
  try {
    health = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(2000) });
  } catch {
    console.log(`SKIP  Worker API check (${apiBase} unreachable)`);
    return;
  }
  if (!health.ok) {
    console.log(`SKIP  Worker API check (health ${health.status})`);
    return;
  }

  const token = await mintAppJwt({
    userId: userA.id,
    email: userA.email,
    organizationId: userA.tenantId,
    workspaceId: userA.workspaceId,
  });

  const res = await fetch(`${apiBase}/api/assets/${objectBId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) {
    ok('Worker GET /api/assets/:foreignId → 404');
  } else {
    const text = await res.text();
    fail(`Worker GET /api/assets/:foreignId expected 404, got ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function seedTenantBundle(admin, label, password) {
  const email = `rls-${label}-${stamp()}@example.com`;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RLS ${label}` },
  });
  if (authError || !authData.user) {
    throw new Error(`createUser ${label}: ${authError?.message || 'unknown'}`);
  }
  const userId = authData.user.id;

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    email,
    full_name: `RLS ${label}`,
    first_name: 'RLS',
    last_name: label,
  });
  if (profileError) throw new Error(`profile ${label}: ${profileError.message}`);

  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      name: `RLS Tenant ${label} ${stamp()}`,
      status: 'active',
      metadata: { source: 'scrum-29-rls-test' },
    })
    .select('tenant_id')
    .single();
  if (tenantError || !tenant) throw new Error(`tenant ${label}: ${tenantError?.message}`);

  const { data: workspace, error: workspaceError } = await admin
    .from('workspaces')
    .insert({
      tenant_id: tenant.tenant_id,
      name: `RLS Workspace ${label}`,
      description: 'SCRUM-29 isolation test',
    })
    .select('workspace_id')
    .single();
  if (workspaceError || !workspace) throw new Error(`workspace ${label}: ${workspaceError?.message}`);

  const { error: roleError } = await admin.from('user_workspace_roles').insert({
    profile_id: userId,
    workspace_id: workspace.workspace_id,
    role: 'owner',
  });
  if (roleError) throw new Error(`role ${label}: ${roleError.message}`);

  const { data: schema, error: schemaError } = await admin
    .from('schemas')
    .insert({
      workspace_id: workspace.workspace_id,
      name: `rls-${label}`,
      description: 'SCRUM-29 test schema',
    })
    .select('schema_id')
    .single();
  if (schemaError || !schema) throw new Error(`schema ${label}: ${schemaError?.message}`);

  const { data: objectType, error: typeError } = await admin
    .from('object_types')
    .insert({
      schema_id: schema.schema_id,
      name: `RLSType${label}`,
      description: 'test',
      is_system: false,
      is_active: true,
      schema_definition: {},
    })
    .select('object_type_id')
    .single();
  if (typeError || !objectType) throw new Error(`object_type ${label}: ${typeError?.message}`);

  const { data: object, error: objectError } = await admin
    .from('objects')
    .insert({
      object_type_id: objectType.object_type_id,
      workspace_id: workspace.workspace_id,
      name: `RLS Object ${label}`,
      status: 'active',
      custom_fields: { source: 'scrum-29' },
      is_deleted: false,
      created_by: userId,
      updated_by: userId,
    })
    .select('object_id')
    .single();
  if (objectError || !object) throw new Error(`object ${label}: ${objectError?.message}`);

  return {
    id: userId,
    email,
    password,
    tenantId: tenant.tenant_id,
    workspaceId: workspace.workspace_id,
    schemaId: schema.schema_id,
    objectTypeId: objectType.object_type_id,
    objectId: object.object_id,
  };
}

async function main() {
  console.log('SCRUM-29 tenant isolation test\n');

  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceKey ||
    isPlaceholder(supabaseUrl) ||
    isPlaceholder(anonKey) ||
    isPlaceholder(serviceKey)
  ) {
    console.error('Missing or placeholder Supabase credentials.');
    console.error(CONFIG_HINT);
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const state = {
    objectIds: [],
    workspaceIds: [],
    tenantIds: [],
    userIds: [],
    schemaIds: [],
  };

  let userA;
  let userB;
  const password = `RlsTest-${stamp()}-Aa1!`;

  try {
    // Confirm RLS helper exists
    const { data: rlsStatus, error: rlsError } = await admin.rpc('check_core_rls_status');
    if (rlsError) {
      fail(
        `check_core_rls_status missing (${rlsError.message}). Apply db/migrations/20260911000000_tenant_rls.sql`
      );
      process.exit(1);
    }
    const disabled = (rlsStatus || []).filter((row) => !row.rls_enabled || row.policy_count < 1);
    if (disabled.length) {
      fail(
        `RLS incomplete on: ${disabled.map((r) => `${r.table_name}(rls=${r.rls_enabled},policies=${r.policy_count})`).join(', ')}`
      );
      process.exit(1);
    }
    ok(`RLS enabled on ${rlsStatus.length} core tables`);

    userA = await seedTenantBundle(admin, 'A', password);
    userB = await seedTenantBundle(admin, 'B', password);
    state.userIds.push(userA.id, userB.id);
    state.tenantIds.push(userA.tenantId, userB.tenantId);
    state.workspaceIds.push(userA.workspaceId, userB.workspaceId);
    state.schemaIds.push(userA.schemaId, userB.schemaId);
    state.objectIds.push(userA.objectId, userB.objectId);
    ok('Seeded tenants A and B');

    const { error: signInError } = await anon.auth.signInWithPassword({
      email: userA.email,
      password,
    });
    if (signInError) {
      fail(`signIn A: ${signInError.message}`);
      await cleanup(admin, state);
      process.exit(1);
    }
    ok('Signed in as user A (anon + JWT)');

    const own = await anon
      .from('objects')
      .select('object_id, name, workspace_id')
      .eq('object_id', userA.objectId)
      .maybeSingle();
    if (own.error || !own.data) {
      fail(`A cannot read own object: ${own.error?.message || 'empty'}`);
    } else {
      ok('A SELECT own object succeeds');
    }

    const foreign = await anon
      .from('objects')
      .select('object_id, name')
      .eq('object_id', userB.objectId)
      .maybeSingle();
    if (foreign.error) {
      ok(`A SELECT foreign object blocked (${foreign.error.message})`);
    } else if (!foreign.data) {
      ok('A SELECT foreign object returns empty (RLS)');
    } else {
      fail('A SELECT foreign object returned a row — cross-tenant leak');
    }

    const updateAttempt = await anon
      .from('objects')
      .update({ name: 'HACKED-BY-A' })
      .eq('object_id', userB.objectId)
      .select('object_id');
    if (updateAttempt.error) {
      ok(`A UPDATE foreign object blocked (${updateAttempt.error.message})`);
    } else if (!updateAttempt.data || updateAttempt.data.length === 0) {
      ok('A UPDATE foreign object affects 0 rows (RLS)');
    } else {
      fail('A UPDATE foreign object succeeded — cross-tenant write');
    }

    // Confirm B's object name unchanged via admin
    const { data: stillB } = await admin
      .from('objects')
      .select('name')
      .eq('object_id', userB.objectId)
      .maybeSingle();
    if (stillB?.name === 'HACKED-BY-A') {
      fail('Foreign object name was changed');
    } else {
      ok('Foreign object unchanged after cross-tenant UPDATE attempt');
    }

    await optionalWorkerCheck(userA, userB.objectId);

    await anon.auth.signOut();
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    await cleanup(admin, state);
    console.log('Cleanup done.');
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.log('\nTenant isolation test FAILED.');
    process.exit(process.exitCode);
  }
  console.log('\nTenant isolation test PASSED.');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
