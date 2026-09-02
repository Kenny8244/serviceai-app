-- SCRUM-28: Core MVP schema for SimpleServiceAI
-- Canonical source of truth. Apply in a fresh Supabase SQL Editor.
-- Idempotent: safe to run more than once on a clean (or already-applied) project.
--
-- Model: tenants (businesses) → workspaces → schemas → object_types → objects
-- Assets/inventory = objects + stock_transactions + view asset_inventory
-- Attributes = JSONB (object_types.schema_definition, objects.custom_fields).
--   First-class attributes table is SCRUM-34.
-- Users = public.profiles referencing auth.users. No password_hash.
-- RLS / tenant isolation = SCRUM-29 (not in this file).
-- Demo restaurant seed = SCRUM-30 (not in this file).
--
-- Requires Supabase (auth.users). Will not apply on bare local Postgres.
-- Apply the whole file in one SQL Editor query on a fresh project (empty public schema).

-- ---------------------------------------------------------------------------
-- Extensions (optional on PG13+; gen_random_uuid() is built-in)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Tenants (businesses / organizations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_size VARCHAR(50),
    industry VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry VARCHAR(100);

-- ---------------------------------------------------------------------------
-- Workspaces (per-tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

-- ---------------------------------------------------------------------------
-- Schemas (data categories per workspace)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schemas (
    schema_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (workspace_id, name)
);

-- ---------------------------------------------------------------------------
-- Object types (templates). schema_definition holds JSONB attribute defs.
-- Example schema_definition:
--   {"fields":[{"name":"quantity","label":"Quantity","type":"number","required":true,"order":1}]}
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS object_types (
    object_type_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schema_id UUID NOT NULL REFERENCES schemas(schema_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    schema_definition JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (schema_id, name)
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with Supabase Auth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(50),
    job_title VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);

-- ---------------------------------------------------------------------------
-- Objects (asset / inventory instances). custom_fields holds JSONB values.
-- Example custom_fields: {"quantity": 12, "unit_cost": 4.5, "location": "Walk-in"}
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS objects (
    object_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    object_type_id UUID NOT NULL REFERENCES object_types(object_type_id) ON DELETE RESTRICT,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- User ↔ workspace roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_workspace_roles (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (profile_id, workspace_id)
);

-- ---------------------------------------------------------------------------
-- Object relations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS object_relations (
    relation_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    to_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (from_object_id, to_object_id, relation_type)
);

-- ---------------------------------------------------------------------------
-- Stock / inventory movements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_transactions (
    txn_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    item_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    location_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    qty_delta DECIMAL(15, 4) NOT NULL,
    reason VARCHAR(255),
    reference_type VARCHAR(100),
    reference_id VARCHAR(100),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Service requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_requests (
    ticket_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    assignee UUID REFERENCES profiles(id) ON DELETE SET NULL,
    description TEXT,
    related_item_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    related_equipment_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    related_vendor_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Attachments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
    attachment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    linked_type VARCHAR(50) NOT NULL,
    linked_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant_id ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schemas_workspace_id ON schemas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_object_types_schema_id ON object_types(schema_id);
CREATE INDEX IF NOT EXISTS idx_objects_workspace_id ON objects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_objects_object_type_id ON objects(object_type_id);
CREATE INDEX IF NOT EXISTS idx_objects_status ON objects(status);
CREATE INDEX IF NOT EXISTS idx_objects_deleted ON objects(is_deleted);
CREATE INDEX IF NOT EXISTS idx_objects_attributes_gin ON objects USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_object_types_schema_definition_gin ON object_types USING GIN (schema_definition);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_workspace_roles_workspace ON user_workspace_roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_object_relations_from ON object_relations(from_object_id);
CREATE INDEX IF NOT EXISTS idx_object_relations_to ON object_relations(to_object_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_workspace ON stock_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON stock_transactions(item_object_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_location ON stock_transactions(location_object_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_workspace ON service_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assignee ON service_requests(assignee);
CREATE INDEX IF NOT EXISTS idx_attachments_workspace ON attachments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_attachments_linked ON attachments(linked_type, linked_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile ON audit_logs(profile_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger function + triggers (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_schemas_updated_at ON schemas;
CREATE TRIGGER update_schemas_updated_at
    BEFORE UPDATE ON schemas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_object_types_updated_at ON object_types;
CREATE TRIGGER update_object_types_updated_at
    BEFORE UPDATE ON object_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_objects_updated_at ON objects;
CREATE TRIGGER update_objects_updated_at
    BEFORE UPDATE ON objects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_object_relations_updated_at ON object_relations;
CREATE TRIGGER update_object_relations_updated_at
    BEFORE UPDATE ON object_relations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;
CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Bootstrap (schema defaults only — not demo seed / SCRUM-30)
-- ---------------------------------------------------------------------------
INSERT INTO tenants (name, metadata, status)
SELECT 'Default Tenant', '{"type": "bootstrap"}'::jsonb, 'active'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE name = 'Default Tenant');

INSERT INTO workspaces (tenant_id, name, description, metadata)
SELECT t.tenant_id, 'Default Workspace', 'Bootstrap workspace', '{"type": "bootstrap"}'::jsonb
FROM tenants t
WHERE t.name = 'Default Tenant'
  AND NOT EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.tenant_id = t.tenant_id AND w.name = 'Default Workspace'
  );

INSERT INTO schemas (workspace_id, name, description)
SELECT w.workspace_id, 'default', 'Default schema for asset management'
FROM workspaces w
JOIN tenants t ON t.tenant_id = w.tenant_id
WHERE t.name = 'Default Tenant'
  AND w.name = 'Default Workspace'
  AND NOT EXISTS (
      SELECT 1 FROM schemas s
      WHERE s.workspace_id = w.workspace_id AND s.name = 'default'
  );

INSERT INTO object_types (schema_id, name, description, is_system, schema_definition)
SELECT s.schema_id, v.type_name, 'System type for ' || v.type_name, true, '{}'::jsonb
FROM schemas s
JOIN workspaces w ON w.workspace_id = s.workspace_id
JOIN tenants t ON t.tenant_id = w.tenant_id
CROSS JOIN (
    VALUES
        ('asset'),
        ('location'),
        ('supplier'),
        ('equipment'),
        ('inventory_item')
) AS v(type_name)
WHERE t.name = 'Default Tenant'
  AND w.name = 'Default Workspace'
  AND s.name = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM object_types ot
      WHERE ot.schema_id = s.schema_id AND ot.name = v.type_name
  );

-- ---------------------------------------------------------------------------
-- Keep public.profiles in sync with Auth signups (official Supabase pattern).
-- Without this, profiles stays empty until the app inserts rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    meta_full_name text;
BEGIN
    meta_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NULLIF(
            concat_ws(
                ' ',
                NEW.raw_user_meta_data->>'first_name',
                NEW.raw_user_meta_data->>'last_name'
            ),
            ''
        ),
        NEW.raw_user_meta_data->>'name'
    );

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        phone_number,
        job_title
    )
    VALUES (
        NEW.id,
        NEW.email,
        meta_full_name,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'job_title'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Inventory view
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.asset_inventory;
CREATE VIEW public.asset_inventory
WITH (security_invoker = true)
AS
WITH inventory AS (
    SELECT
        o.object_id,
        o.name,
        ot.name AS object_type,
        o.status,
        (o.custom_fields->>'quantity')::numeric AS quantity,
        (o.custom_fields->>'min_quantity')::numeric AS min_quantity,
        (o.custom_fields->>'unit_cost')::numeric AS unit_cost,
        o.custom_fields->>'location' AS location_name,
        o.workspace_id,
        o.created_at,
        o.updated_at
    FROM objects o
    JOIN object_types ot ON o.object_type_id = ot.object_type_id
    WHERE (ot.name = 'inventory_item' OR ot.name = 'asset')
      AND o.is_deleted = false
)
SELECT
    object_id,
    name,
    object_type,
    status,
    COALESCE(quantity, 0) AS quantity,
    COALESCE(min_quantity, 0) AS min_quantity,
    COALESCE(unit_cost, 0) AS unit_cost,
    (COALESCE(quantity, 0) * COALESCE(unit_cost, 0)) AS total_value,
    location_name,
    CASE
        WHEN quantity <= min_quantity AND quantity > 0 THEN 'low_stock'
        WHEN COALESCE(quantity, 0) = 0 THEN 'out_of_stock'
        ELSE 'in_stock'
    END AS stock_status,
    workspace_id,
    created_at,
    updated_at
FROM inventory;
