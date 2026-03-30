-- Complete Database Setup for Service AI
-- Run this in a fresh Supabase project

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core Tables
-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schemas
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

-- Object Types
CREATE TABLE IF NOT EXISTS object_types (
    object_type_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    schema_id UUID NOT NULL REFERENCES schemas(schema_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    schema_definition JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(schema_id, name)
);

-- Objects
CREATE TABLE IF NOT EXISTS objects (
    object_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    object_type_id UUID NOT NULL REFERENCES object_types(object_type_id) ON DELETE RESTRICT,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    custom_fields JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Workspace Roles
CREATE TABLE IF NOT EXISTS user_workspace_roles (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, workspace_id)
);

-- Object Relations
CREATE TABLE IF NOT EXISTS object_relations (
    relation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    to_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_object_id, to_object_id, relation_type)
);

-- Stock Transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
    txn_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    item_object_id UUID NOT NULL REFERENCES objects(object_id) ON DELETE CASCADE,
    location_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    qty_delta DECIMAL(15, 4) NOT NULL,
    reason VARCHAR(255),
    reference_type VARCHAR(100),
    reference_id VARCHAR(100),
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Requests
CREATE TABLE IF NOT EXISTS service_requests (
    ticket_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    assignee_user_id UUID,
    description TEXT,
    related_item_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    related_equipment_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    related_vendor_object_id UUID REFERENCES objects(object_id) ON DELETE SET NULL,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
    attachment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    linked_type VARCHAR(50) NOT NULL,
    linked_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_objects_workspace_id ON objects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_objects_object_type_id ON objects(object_type_id);
CREATE INDEX IF NOT EXISTS idx_objects_status ON objects(status);
CREATE INDEX IF NOT EXISTS idx_objects_deleted ON objects(is_deleted);
CREATE INDEX IF NOT EXISTS idx_objects_attributes_gin ON objects USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schemas_updated_at BEFORE UPDATE ON schemas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_object_types_updated_at BEFORE UPDATE ON object_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON objects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_object_relations_updated_at BEFORE UPDATE ON object_relations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO tenants (name, metadata, status) VALUES ('Default Tenant', '{"type": "demo"}', 'active') ON CONFLICT DO NOTHING;

-- Get the tenant ID for workspace creation
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO default_tenant_id FROM tenants WHERE name = 'Default Tenant' LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        INSERT INTO workspaces (tenant_id, name, description, metadata) 
        VALUES (default_tenant_id, 'Default Workspace', 'Default workspace for demo', '{"type": "demo"}')
        ON CONFLICT DO NOTHING;
        
        -- Get workspace ID for schema creation
        DECLARE
            default_workspace_id UUID;
        BEGIN
            SELECT workspace_id INTO default_workspace_id FROM workspaces WHERE name = 'Default Workspace' LIMIT 1;
            
            IF default_workspace_id IS NOT NULL THEN
                INSERT INTO schemas (workspace_id, name, description) 
                VALUES (default_workspace_id, 'Default Schema', 'Default schema for demo')
                ON CONFLICT DO NOTHING;
                
                -- Get schema ID for object types
                DECLARE
                    default_schema_id UUID;
                BEGIN
                    SELECT schema_id INTO default_schema_id FROM schemas WHERE name = 'Default Schema' LIMIT 1;
                    
                    IF default_schema_id IS NOT NULL THEN
                        INSERT INTO object_types (schema_id, name, description, is_system, schema_definition) 
                        VALUES 
                            (default_schema_id, 'asset', 'System type for assets', true, '{}'),
                            (default_schema_id, 'location', 'System type for locations', true, '{}'),
                            (default_schema_id, 'supplier', 'System type for suppliers', true, '{}'),
                            (default_schema_id, 'equipment', 'System type for equipment', true, '{}'),
                            (default_schema_id, 'inventory_item', 'System type for inventory items', true, '{}')
                        ON CONFLICT DO NOTHING;
                    END IF;
                END;
            END IF;
        END;
    END IF;
END $$;

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create view for asset inventory
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE object_relations ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = user_id);
