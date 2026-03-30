-- Enhancement Migration: Add missing features
-- Run this after the main migration

-- First, create the users table
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

-- Add metadata and status to tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add metadata to workspaces
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add schema_definition to object_types
ALTER TABLE object_types 
ADD COLUMN IF NOT EXISTS schema_definition JSONB DEFAULT '{}';

-- Now create user_workspace_roles (after users table exists)
CREATE TABLE IF NOT EXISTS user_workspace_roles (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, workspace_id)
);

-- Create audit_logs table
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

-- Add version and soft delete to objects
ALTER TABLE objects 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_objects_deleted ON objects(is_deleted);
CREATE INDEX IF NOT EXISTS idx_objects_attributes_gin ON objects USING GIN (custom_fields);

-- Add trigger for audit logging
CREATE OR REPLACE FUNCTION log_object_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
        VALUES ('CREATE', TG_TABLE_NAME, NEW.object_id, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, old_values, new_values)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.object_id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, old_values)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.object_id, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_objects
AFTER INSERT OR UPDATE OR DELETE ON objects
FOR EACH ROW EXECUTE FUNCTION log_object_changes();

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE object_relations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (basic example)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
