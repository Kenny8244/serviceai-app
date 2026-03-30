-- Migration: Workflow Schema
-- This migration sets up the core workflow-based schema for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schemas table
CREATE TABLE IF NOT EXISTS schemas (
    schema_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);

-- Object Types table
CREATE TABLE IF NOT EXISTS object_types (
    object_type_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    schema_id UUID NOT NULL REFERENCES schemas(schema_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(schema_id, name)
);

-- Objects table (core entity table)
CREATE TABLE IF NOT EXISTS objects (
    object_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    object_type_id UUID NOT NULL REFERENCES object_types(object_type_id) ON DELETE RESTRICT,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID, -- References auth.users if using Supabase Auth
    updated_by UUID, -- References auth.users if using Supabase Auth
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Object Relations table
CREATE TABLE IF NOT EXISTS object_relations (
    relation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    to_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_object_id, to_object_id, relation_type)
);

-- Stock Transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
    txn_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    item_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    location_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    qty_delta DECIMAL(15, 4) NOT NULL,
    reason VARCHAR(255),
    reference_type VARCHAR(100),
    reference_id VARCHAR(100),
    created_by_user_id UUID, -- References auth.users if using Supabase Auth
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Requests table
CREATE TABLE IF NOT EXISTS service_requests (
    ticket_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    assignee_user_id UUID, -- References auth.users if using Supabase Auth
    description TEXT,
    related_item_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    related_equipment_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    related_vendor_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    created_by_user_id UUID, -- References auth.users if using Supabase Auth
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
    attachment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    linked_type VARCHAR(50) NOT NULL, -- 'object', 'service_request', etc.
    linked_id UUID NOT NULL, -- ID of the linked entity
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    uploaded_by UUID, -- References auth.users if using Supabase Auth
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX idx_objects_workspace_id ON objects(workspace_id);
CREATE INDEX idx_objects_object_type_id ON objects(object_type_id);
CREATE INDEX idx_objects_status ON objects(status);
CREATE INDEX idx_object_relations_from ON object_relations(from_object_id);
CREATE INDEX idx_object_relations_to ON object_relations(to_object_id);
CREATE INDEX idx_stock_transactions_item ON stock_transactions(item_object_id);
CREATE INDEX idx_stock_transactions_location ON stock_transactions(location_object_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_attachments_linked ON attachments(linked_type, linked_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schemas_updated_at
BEFORE UPDATE ON schemas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_object_types_updated_at
BEFORE UPDATE ON object_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objects_updated_at
BEFORE UPDATE ON objects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_object_relations_updated_at
BEFORE UPDATE ON object_relations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default tenant and workspace
INSERT INTO tenants (name) VALUES ('Default Tenant')
ON CONFLICT DO NOTHING;

-- This assumes the tenant_id is 00000000-0000-0000-0000-000000000000
-- You might need to adjust this based on your actual tenant ID
INSERT INTO workspaces (tenant_id, name, description)
SELECT '00000000-0000-0000-0000-000000000000', 'Default Workspace', 'Default workspace for initial setup'
WHERE NOT EXISTS (SELECT 1 FROM workspaces);

-- Create default schema
INSERT INTO schemas (workspace_id, name, description)
SELECT 
    (SELECT workspace_id FROM workspaces LIMIT 1), 
    'default', 
    'Default schema for asset management'
WHERE NOT EXISTS (SELECT 1 FROM schemas);

-- Create default object types
WITH default_types AS (
    SELECT 
        (SELECT schema_id FROM schemas LIMIT 1) as schema_id,
        unnest(ARRAY['asset', 'location', 'supplier', 'equipment', 'inventory_item']) as type_name
)
INSERT INTO object_types (schema_id, name, description, is_system)
SELECT 
    dt.schema_id,
    dt.type_name,
    'System type for ' || dt.type_name || ' objects',
    true
FROM default_types dt
WHERE NOT EXISTS (SELECT 1 FROM object_types WHERE name = dt.type_name);

-- Create a view for asset inventory
CREATE OR REPLACE VIEW asset_inventory AS
WITH inventory AS (
    SELECT 
        o.object_id,
        o.name,
        ot.name as object_type,
        o.status,
        (o.custom_fields->>'quantity')::numeric as quantity,
        (o.custom_fields->>'min_quantity')::numeric as min_quantity,
        (o.custom_fields->>'unit_cost')::numeric as unit_cost,
        o.custom_fields->>'location' as location_name,
        o.workspace_id,
        o.created_at,
        o.updated_at
    FROM objects o
    JOIN object_types ot ON o.object_type_id = ot.object_type_id
    WHERE ot.name = 'inventory_item' OR ot.name = 'asset'
)
SELECT 
    object_id,
    name,
    object_type,
    status,
    COALESCE(quantity, 0) as quantity,
    COALESCE(min_quantity, 0) as min_quantity,
    COALESCE(unit_cost, 0) as unit_cost,
    (COALESCE(quantity, 0) * COALESCE(unit_cost, 0)) as total_value,
    location_name,
    CASE 
        WHEN quantity <= min_quantity AND quantity > 0 THEN 'low_stock'
        WHEN quantity = 0 THEN 'out_of_stock'
        ELSE 'in_stock'
    END as stock_status,
    workspace_id,
    created_at,
    updated_at
FROM inventory;
