/**
 * SCRUM-30: Development seed data (multi-vertical demo).
 *
 * Idempotent seed for local/dev Supabase:
 * - Ensures demo@simpleserviceai.com / demo123
 * - Ensures one Demo Company tenant + 4 workspaces (one per vertical)
 * - Seeds sample assets + service_requests per workspace
 *
 * Prerequisites:
 * - Core schema applied (complete_setup + follow-ons as needed)
 * - worker/.dev.vars with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npm run db:seed
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../../worker/.dev.vars') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const CONFIG_HINT =
  'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in worker/.dev.vars (copy from worker/.dev.vars.example).';

const SEED_SOURCE = 'scrum-30-seed';
const DEMO_EMAIL = 'demo@simpleserviceai.com';
const DEMO_PASSWORD = 'demo123';
const TENANT_NAME = 'Demo Company';

const OBJECT_TYPES = [
  { name: 'Freezer', description: 'Cold storage equipment and freezer units.' },
  { name: 'Product', description: 'Sellable or stocked products.' },
  { name: 'Equipment', description: 'Tools, appliances, and operational equipment.' },
  { name: 'Ingredient', description: 'Raw ingredients and consumable supplies.' },
];

/** @typedef {{ type: string, name: string, custom_fields: Record<string, unknown> }} SeedAsset */
/**
 * @typedef {{
 *   type: string,
 *   status: string,
 *   priority: string,
 *   description: string,
 *   title?: string,
 *   category?: string,
 *   relatedAssetSeedKey?: string,
 * }} SeedServiceRequest
 */

/** Derive a display title from seed description (strips SCRUM-30 tag). */
function titleFromSeedDescription(description) {
  const stripped = String(description || '')
    .replace(new RegExp(`^\\[${SEED_SOURCE}(?::[^\\]]+)?\\]\\s*`), '')
    .trim();
  return (stripped.slice(0, 200) || 'Service request');
}

/**
 * @type {Array<{
 *   verticalId: string,
 *   workspaceName: string,
 *   description: string,
 *   legacyNames: string[],
 *   assets: SeedAsset[],
 *   serviceRequests: SeedServiceRequest[],
 * }>}
 */
const VERTICAL_SEEDS = [
  {
    verticalId: 'retail',
    workspaceName: 'Demo Retail',
    description: 'Demo retail store workspace (SCRUM-30)',
    legacyNames: [],
    assets: [
      {
        type: 'Equipment',
        name: 'POS Terminal Front',
        custom_fields: {
          location: 'Checkout 1',
          supplier: 'RetailTech',
          serial_number: 'POS-R-001',
          seed_key: 'retail-pos-1',
          source: SEED_SOURCE,
          verticalId: 'retail',
        },
      },
      {
        type: 'Equipment',
        name: 'Barcode Scanner Aisle 3',
        custom_fields: {
          location: 'Aisle 3',
          supplier: 'ScanFast',
          serial_number: 'SCN-R-014',
          seed_key: 'retail-scanner',
          source: SEED_SOURCE,
          verticalId: 'retail',
        },
      },
      {
        type: 'Product',
        name: 'Organic Coffee Beans 1kg',
        custom_fields: {
          sku: 'RTL-COFFEE-1KG',
          quantity: 64,
          min_quantity: 20,
          unit_cost: 12.5,
          supplier: 'Bean Co',
          location: 'Shelf B2',
          seed_key: 'retail-coffee',
          source: SEED_SOURCE,
          verticalId: 'retail',
        },
      },
      {
        type: 'Product',
        name: 'Store Brand Pasta 500g',
        custom_fields: {
          sku: 'RTL-PASTA-500',
          quantity: 180,
          min_quantity: 50,
          unit_cost: 1.1,
          supplier: 'GrainWorks',
          location: 'Aisle 5',
          seed_key: 'retail-pasta',
          source: SEED_SOURCE,
          verticalId: 'retail',
        },
      },
      {
        type: 'Freezer',
        name: 'Frozen Aisle Case',
        custom_fields: {
          location: 'Aisle 8',
          temperature: -18,
          capacity: 200,
          seed_key: 'retail-freezer',
          source: SEED_SOURCE,
          verticalId: 'retail',
        },
      },
      {
        type: 'Ingredient',
        name: 'Deli Turkey Slices',
        custom_fields: {
          quantity: 12,
          unit: 'kg',
          min_quantity: 4,
          location: 'Deli cooler',
          perishable: true,
          seed_key: 'retail-turkey',
          source: SEED_SOURCE,
          verticalId: 'retail',
        },
      },
    ],
    serviceRequests: [
      {
        type: 'Equipment',
        status: 'open',
        priority: 'high',
        description: `[${SEED_SOURCE}:retail] POS Terminal Front card reader intermittent`,
        relatedAssetSeedKey: 'retail-pos-1',
      },
      {
        type: 'Facility',
        status: 'in_progress',
        priority: 'medium',
        description: `[${SEED_SOURCE}:retail] Frozen Aisle Case frosting over — defrost cycle`,
        relatedAssetSeedKey: 'retail-freezer',
      },
    ],
  },
  {
    verticalId: 'restaurant',
    workspaceName: 'Demo Restaurant',
    description: 'Demo restaurant kitchen workspace (SCRUM-30)',
    legacyNames: ['Main Kitchen', 'Default Workspace'],
    assets: [
      {
        type: 'Freezer',
        name: 'Walk-in Freezer A',
        custom_fields: {
          location: 'Back kitchen',
          temperature: -18,
          capacity: 400,
          seed_key: 'freezer-a',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
      {
        type: 'Freezer',
        name: 'Prep Line Reach-in',
        custom_fields: {
          location: 'Prep line',
          temperature: -12,
          capacity: 80,
          seed_key: 'freezer-reach-in',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
      {
        type: 'Equipment',
        name: 'Commercial Oven #1',
        custom_fields: {
          location: 'Hot line',
          supplier: 'KitchenPro',
          serial_number: 'OVN-DEMO-001',
          seed_key: 'oven-1',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
      {
        type: 'Equipment',
        name: 'Dishwasher Station',
        custom_fields: {
          location: 'Dish pit',
          supplier: 'CleanWash Co',
          serial_number: 'DW-DEMO-014',
          seed_key: 'dishwasher',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
      {
        type: 'Product',
        name: 'House Burger Patty (frozen)',
        custom_fields: {
          sku: 'PRD-BURGER-4OZ',
          quantity: 120,
          min_quantity: 40,
          unit_cost: 1.85,
          supplier: 'Local Meats LLC',
          location: 'Walk-in Freezer A',
          seed_key: 'product-burger',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
      {
        type: 'Product',
        name: 'Sourdough Bun Pack',
        custom_fields: {
          sku: 'PRD-BUN-12',
          quantity: 48,
          min_quantity: 24,
          unit_cost: 3.2,
          supplier: 'City Bakery',
          location: 'Dry storage',
          seed_key: 'product-bun',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
      {
        type: 'Ingredient',
        name: 'Romaine Lettuce',
        custom_fields: {
          quantity: 8,
          unit: 'kg',
          min_quantity: 3,
          location: 'Walk-in cooler',
          perishable: true,
          seed_key: 'ing-lettuce',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
      {
        type: 'Ingredient',
        name: 'Canola Oil',
        custom_fields: {
          quantity: 6,
          unit: 'L',
          min_quantity: 2,
          location: 'Dry storage',
          perishable: false,
          seed_key: 'ing-oil',
          source: SEED_SOURCE,
          verticalId: 'restaurant',
        },
      },
    ],
    serviceRequests: [
      {
        type: 'Equipment',
        status: 'open',
        priority: 'high',
        description: `[${SEED_SOURCE}:restaurant] Walk-in Freezer A compressor noise — needs inspection`,
        relatedAssetSeedKey: 'freezer-a',
      },
      {
        type: 'Facility',
        status: 'in_progress',
        priority: 'medium',
        description: `[${SEED_SOURCE}:restaurant] Dishwasher Station drain slow — plumbing follow-up`,
        relatedAssetSeedKey: 'dishwasher',
      },
      {
        type: 'Supplier',
        status: 'open',
        priority: 'low',
        description: `[${SEED_SOURCE}:restaurant] Short delivery on Romaine Lettuce — credit request`,
        relatedAssetSeedKey: 'ing-lettuce',
      },
    ],
  },
  {
    verticalId: 'store-market',
    workspaceName: 'Demo Marketplace',
    description: 'Demo marketplace operations workspace (SCRUM-30)',
    legacyNames: [],
    assets: [
      {
        type: 'Equipment',
        name: 'Vendor Kiosk Printer',
        custom_fields: {
          location: 'Booth 12',
          supplier: 'PrintHub',
          serial_number: 'PRT-M-012',
          seed_key: 'mkt-printer',
          source: SEED_SOURCE,
          verticalId: 'store-market',
        },
      },
      {
        type: 'Equipment',
        name: 'Parcel Scale Dock B',
        custom_fields: {
          location: 'Dock B',
          supplier: 'WeighRight',
          serial_number: 'SCL-M-007',
          seed_key: 'mkt-scale',
          source: SEED_SOURCE,
          verticalId: 'store-market',
        },
      },
      {
        type: 'Product',
        name: 'Vendor Packing Mailers M',
        custom_fields: {
          sku: 'MKT-MAILER-M',
          quantity: 500,
          min_quantity: 100,
          unit_cost: 0.35,
          supplier: 'ShipSupply',
          location: 'Fulfillment cage',
          seed_key: 'mkt-mailers',
          source: SEED_SOURCE,
          verticalId: 'store-market',
        },
      },
      {
        type: 'Product',
        name: 'Return Label Rolls',
        custom_fields: {
          sku: 'MKT-LABEL-R',
          quantity: 40,
          min_quantity: 10,
          unit_cost: 18,
          supplier: 'LabelCo',
          location: 'CS desk',
          seed_key: 'mkt-labels',
          source: SEED_SOURCE,
          verticalId: 'store-market',
        },
      },
      {
        type: 'Freezer',
        name: 'Cold Chain Locker',
        custom_fields: {
          location: 'Dock C',
          temperature: 2,
          capacity: 60,
          seed_key: 'mkt-locker',
          source: SEED_SOURCE,
          verticalId: 'store-market',
        },
      },
      {
        type: 'Ingredient',
        name: 'Sample Promo Snack Mix',
        custom_fields: {
          quantity: 20,
          unit: 'kg',
          min_quantity: 5,
          location: 'Promo closet',
          perishable: true,
          seed_key: 'mkt-snacks',
          source: SEED_SOURCE,
          verticalId: 'store-market',
        },
      },
    ],
    serviceRequests: [
      {
        type: 'Equipment',
        status: 'open',
        priority: 'high',
        description: `[${SEED_SOURCE}:store-market] Vendor Kiosk Printer jam — swap ribbon`,
        relatedAssetSeedKey: 'mkt-printer',
      },
      {
        type: 'Supplier',
        status: 'open',
        priority: 'medium',
        description: `[${SEED_SOURCE}:store-market] Late shipment of Vendor Packing Mailers M`,
        relatedAssetSeedKey: 'mkt-mailers',
      },
    ],
  },
  {
    verticalId: 'business',
    workspaceName: 'Demo Enterprise',
    description: 'Demo enterprise facilities workspace (SCRUM-30)',
    legacyNames: [],
    assets: [
      {
        type: 'Equipment',
        name: 'Conference Room AV Rack',
        custom_fields: {
          location: 'Floor 4 / CR-401',
          supplier: 'AV Systems Inc',
          serial_number: 'AV-E-401',
          seed_key: 'ent-av',
          source: SEED_SOURCE,
          verticalId: 'business',
        },
      },
      {
        type: 'Equipment',
        name: 'Badge Printer HQ Lobby',
        custom_fields: {
          location: 'HQ Lobby',
          supplier: 'SecurePrint',
          serial_number: 'BDG-E-001',
          seed_key: 'ent-badge',
          source: SEED_SOURCE,
          verticalId: 'business',
        },
      },
      {
        type: 'Product',
        name: 'Laptop Docking Stations',
        custom_fields: {
          sku: 'ENT-DOCK-USB',
          quantity: 35,
          min_quantity: 10,
          unit_cost: 89,
          supplier: 'IT Depot',
          location: 'IT cage',
          seed_key: 'ent-docks',
          source: SEED_SOURCE,
          verticalId: 'business',
        },
      },
      {
        type: 'Product',
        name: 'Office Chair Ergonomic',
        custom_fields: {
          sku: 'ENT-CHAIR-ERG',
          quantity: 22,
          min_quantity: 8,
          unit_cost: 240,
          supplier: 'FurnishCo',
          location: 'Facilities store',
          seed_key: 'ent-chairs',
          source: SEED_SOURCE,
          verticalId: 'business',
        },
      },
      {
        type: 'Freezer',
        name: 'Cafe Ice Machine',
        custom_fields: {
          location: 'HQ Cafe',
          temperature: -2,
          capacity: 50,
          seed_key: 'ent-ice',
          source: SEED_SOURCE,
          verticalId: 'business',
        },
      },
      {
        type: 'Ingredient',
        name: 'Cafe Coffee Beans',
        custom_fields: {
          quantity: 15,
          unit: 'kg',
          min_quantity: 5,
          location: 'Cafe pantry',
          perishable: false,
          seed_key: 'ent-coffee',
          source: SEED_SOURCE,
          verticalId: 'business',
        },
      },
    ],
    serviceRequests: [
      {
        type: 'Equipment',
        status: 'open',
        priority: 'urgent',
        description: `[${SEED_SOURCE}:business] Conference Room AV Rack HDMI switch failing`,
        relatedAssetSeedKey: 'ent-av',
      },
      {
        type: 'Facility',
        status: 'in_progress',
        priority: 'medium',
        description: `[${SEED_SOURCE}:business] Cafe Ice Machine slow fill — filter check`,
        relatedAssetSeedKey: 'ent-ice',
      },
    ],
  },
];

function isPlaceholder(value) {
  return !value || /your-supabase|your-project-ref|replace-with/i.test(value);
}

function ok(message) {
  console.log(`OK    ${message}`);
}

function info(message) {
  console.log(`INFO  ${message}`);
}

function fail(message) {
  console.error(`FAIL  ${message}`);
  process.exitCode = 1;
}

function metadataObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
}

async function ensureDemoUser(admin) {
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, email')
    .eq('email', DEMO_EMAIL)
    .maybeSingle();

  if (existingProfile?.id) {
    ok(`Demo user exists (${DEMO_EMAIL})`);
    return existingProfile.id;
  }

  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const authUser = (listed?.users || []).find((u) => (u.email || '').toLowerCase() === DEMO_EMAIL);
  let userId = authUser?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: 'Demo',
        last_name: 'User',
        full_name: 'Demo User',
        phone_number: '+1 (555) 123-4567',
        job_title: 'Demo Manager',
      },
    });
    if (error || !data.user) {
      throw new Error(`createUser: ${error?.message || 'unknown'}`);
    }
    userId = data.user.id;
    ok(`Created auth user ${DEMO_EMAIL}`);
  } else {
    info('Auth user found without profile; upserting profile');
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: DEMO_EMAIL,
      full_name: 'Demo User',
      first_name: 'Demo',
      last_name: 'User',
      phone_number: '+1 (555) 123-4567',
      job_title: 'Demo Manager',
    },
    { onConflict: 'id' }
  );
  if (profileError) throw new Error(`profile upsert: ${profileError.message}`);
  ok('Demo profile ready');
  return userId;
}

async function ensureDemoTenant(admin, userId) {
  const { data: roles } = await admin
    .from('user_workspace_roles')
    .select('workspace_id')
    .eq('profile_id', userId);

  let tenantId = null;
  if (roles?.length) {
    const { data: workspace } = await admin
      .from('workspaces')
      .select('tenant_id')
      .eq('workspace_id', roles[0].workspace_id)
      .maybeSingle();
    tenantId = workspace?.tenant_id || null;
  }

  if (!tenantId) {
    const { data: byName } = await admin
      .from('tenants')
      .select('tenant_id, name, metadata')
      .in('name', [TENANT_NAME, 'Demo Restaurant', 'Demo Company']);

    const seeded = (byName || []).find((t) => metadataObject(t.metadata).source === SEED_SOURCE);
    tenantId = seeded?.tenant_id || byName?.[0]?.tenant_id || null;
  }

  if (!tenantId) {
    const { data: tenant, error } = await admin
      .from('tenants')
      .insert({
        name: TENANT_NAME,
        industry: 'multi',
        company_size: '11-50',
        status: 'active',
        metadata: { source: SEED_SOURCE, multiVertical: true },
      })
      .select('tenant_id')
      .single();
    if (error || !tenant) throw new Error(`tenant: ${error?.message || 'unknown'}`);
    tenantId = tenant.tenant_id;
    ok(`Created tenant ${TENANT_NAME}`);
  } else {
    await admin
      .from('tenants')
      .update({
        name: TENANT_NAME,
        industry: 'multi',
        company_size: '11-50',
        status: 'active',
        metadata: { source: SEED_SOURCE, multiVertical: true },
      })
      .eq('tenant_id', tenantId);
    ok(`Demo tenant ready (${TENANT_NAME})`);
  }

  return tenantId;
}

async function ensureWorkspaceForVertical(admin, userId, tenantId, vertical) {
  const { data: workspaces } = await admin
    .from('workspaces')
    .select('workspace_id, name, metadata')
    .eq('tenant_id', tenantId);

  let match =
    (workspaces || []).find((w) => metadataObject(w.metadata).verticalId === vertical.verticalId) ||
    (workspaces || []).find((w) => w.name === vertical.workspaceName) ||
    (workspaces || []).find((w) => vertical.legacyNames.includes(w.name));

  // One-time: if restaurant and only a single unlabeled membership workspace exists, claim it
  if (!match && vertical.verticalId === 'restaurant') {
    const unlabeled = (workspaces || []).filter((w) => !metadataObject(w.metadata).verticalId);
    if (unlabeled.length === 1) match = unlabeled[0];
  }

  let workspaceId = match?.workspace_id;

  if (workspaceId) {
    await admin
      .from('workspaces')
      .update({
        name: vertical.workspaceName,
        description: vertical.description,
        metadata: { source: SEED_SOURCE, verticalId: vertical.verticalId },
      })
      .eq('workspace_id', workspaceId);
    ok(`[${vertical.verticalId}] workspace ready: ${vertical.workspaceName}`);
  } else {
    const { data: created, error } = await admin
      .from('workspaces')
      .insert({
        tenant_id: tenantId,
        name: vertical.workspaceName,
        description: vertical.description,
        metadata: { source: SEED_SOURCE, verticalId: vertical.verticalId },
      })
      .select('workspace_id')
      .single();
    if (error || !created) throw new Error(`workspace ${vertical.verticalId}: ${error?.message || 'unknown'}`);
    workspaceId = created.workspace_id;
    ok(`[${vertical.verticalId}] created workspace ${vertical.workspaceName}`);
  }

  const { data: existingRole } = await admin
    .from('user_workspace_roles')
    .select('profile_id')
    .eq('profile_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!existingRole) {
    const { error: roleError } = await admin.from('user_workspace_roles').insert({
      profile_id: userId,
      workspace_id: workspaceId,
      role: 'owner',
    });
    if (roleError) throw new Error(`role ${vertical.verticalId}: ${roleError.message}`);
  }

  return workspaceId;
}

async function ensureSchemaAndTypes(admin, workspaceId, label) {
  let { data: schema } = await admin
    .from('schemas')
    .select('schema_id')
    .eq('workspace_id', workspaceId)
    .eq('name', 'default')
    .maybeSingle();

  if (!schema?.schema_id) {
    const { data: created, error } = await admin
      .from('schemas')
      .insert({
        workspace_id: workspaceId,
        name: 'default',
        description: 'Default schema for asset management',
        is_active: true,
      })
      .select('schema_id')
      .single();
    if (error || !created) throw new Error(`schema ${label}: ${error?.message || 'unknown'}`);
    schema = created;
  }

  const schemaId = schema.schema_id;
  const { data: existingTypes } = await admin
    .from('object_types')
    .select('object_type_id, name')
    .eq('schema_id', schemaId);

  const byName = new Map((existingTypes || []).map((t) => [t.name, t.object_type_id]));
  const missing = OBJECT_TYPES.filter((t) => !byName.has(t.name));

  if (missing.length) {
    const { data: inserted, error } = await admin
      .from('object_types')
      .insert(
        missing.map((t) => ({
          schema_id: schemaId,
          name: t.name,
          description: t.description,
          is_system: false,
          is_active: true,
          schema_definition: {},
        }))
      )
      .select('object_type_id, name');
    if (error) throw new Error(`object_types ${label}: ${error.message}`);
    for (const row of inserted || []) {
      byName.set(row.name, row.object_type_id);
    }
  }

  return { schemaId, typeIdsByName: byName };
}

async function ensureAssets(admin, workspaceId, userId, typeIdsByName, assets, label) {
  const { data: existing } = await admin
    .from('objects')
    .select('object_id, name, custom_fields')
    .eq('workspace_id', workspaceId)
    .eq('is_deleted', false);

  const bySeedKey = new Map();
  const byName = new Map();
  for (const row of existing || []) {
    byName.set(row.name, row.object_id);
    const key = row.custom_fields?.seed_key;
    if (key) bySeedKey.set(key, row.object_id);
  }

  let created = 0;
  let skipped = 0;
  const objectIdsBySeedKey = new Map(bySeedKey);

  for (const asset of assets) {
    const seedKey = asset.custom_fields.seed_key;
    if (bySeedKey.has(seedKey) || byName.has(asset.name)) {
      objectIdsBySeedKey.set(seedKey, bySeedKey.get(seedKey) || byName.get(asset.name));
      skipped += 1;
      continue;
    }

    const typeId = typeIdsByName.get(asset.type);
    if (!typeId) throw new Error(`Missing object type ${asset.type} (${label})`);

    const { data, error } = await admin
      .from('objects')
      .insert({
        object_type_id: typeId,
        workspace_id: workspaceId,
        name: asset.name,
        status: 'active',
        custom_fields: asset.custom_fields,
        is_deleted: false,
        created_by: userId,
        updated_by: userId,
      })
      .select('object_id')
      .single();

    if (error || !data) throw new Error(`object ${asset.name}: ${error?.message || 'unknown'}`);
    objectIdsBySeedKey.set(seedKey, data.object_id);
    created += 1;
  }

  ok(`[${label}] assets: ${created} created, ${skipped} present (${assets.length} total)`);
  return objectIdsBySeedKey;
}

async function ensureServiceRequests(admin, workspaceId, userId, objectIdsBySeedKey, requests, label) {
  const { data: existing } = await admin
    .from('service_requests')
    .select('ticket_id, description')
    .eq('workspace_id', workspaceId);

  const existingDescriptions = new Set((existing || []).map((r) => r.description || ''));
  let created = 0;
  let skipped = 0;

  for (const req of requests) {
    const unscoped =
      label === 'restaurant'
        ? req.description.replace(`[${SEED_SOURCE}:restaurant]`, `[${SEED_SOURCE}]`)
        : null;
    if (existingDescriptions.has(req.description) || (unscoped && existingDescriptions.has(unscoped))) {
      skipped += 1;
      continue;
    }

    const relatedId = req.relatedAssetSeedKey
      ? objectIdsBySeedKey.get(req.relatedAssetSeedKey) || null
      : null;
    const category = req.category || req.type;

    const row = {
      workspace_id: workspaceId,
      type: req.type,
      title: req.title || titleFromSeedDescription(req.description),
      category,
      status: req.status,
      priority: req.priority,
      description: req.description,
      assignee: userId,
      created_by: userId,
      related_asset_object_id: relatedId,
      // Legacy columns kept populated for older readers until fully deprecated.
      related_equipment_object_id: req.type === 'Equipment' || req.type === 'Facility' ? relatedId : null,
      related_item_object_id: req.type === 'Supplier' ? relatedId : null,
    };

    const { error } = await admin.from('service_requests').insert(row);
    if (error) throw new Error(`service_request ${label}: ${error.message}`);
    created += 1;
  }

  ok(`[${label}] service requests: ${created} created, ${skipped} present (${requests.length} total)`);
}

async function main() {
  console.log('SCRUM-30 multi-vertical demo seed\n');

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !serviceKey || isPlaceholder(supabaseUrl) || isPlaceholder(serviceKey)) {
    console.error('Missing or placeholder SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
    console.error(CONFIG_HINT);
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const table of ['tenants', 'workspaces', 'objects', 'service_requests', 'profiles']) {
    const { error } = await admin.from(table).select('*', { head: true, count: 'exact' }).limit(1);
    if (error) {
      fail(`Table ${table} unavailable: ${error.message}`);
      console.error('Apply db/migrations/20240207000000_complete_setup.sql (and follow-ons) first.');
      process.exit(1);
    }
  }

  try {
    const userId = await ensureDemoUser(admin);
    const tenantId = await ensureDemoTenant(admin, userId);
    const summary = [];

    for (const vertical of VERTICAL_SEEDS) {
      const workspaceId = await ensureWorkspaceForVertical(admin, userId, tenantId, vertical);
      const { typeIdsByName } = await ensureSchemaAndTypes(admin, workspaceId, vertical.verticalId);
      const objectIds = await ensureAssets(
        admin,
        workspaceId,
        userId,
        typeIdsByName,
        vertical.assets,
        vertical.verticalId
      );
      await ensureServiceRequests(
        admin,
        workspaceId,
        userId,
        objectIds,
        vertical.serviceRequests,
        vertical.verticalId
      );
      summary.push({ verticalId: vertical.verticalId, workspaceId, name: vertical.workspaceName });
    }

    console.log('\nSeed complete.');
    console.log(`  Tenant: ${TENANT_NAME} (${tenantId})`);
    for (const row of summary) {
      console.log(`  ${row.verticalId.padEnd(12)} ${row.name} (${row.workspaceId})`);
    }
    console.log(`  Login:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    console.log('  Tip:    Select a vertical after Try Demo — workspace switches to that vertical’s seed.');
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
