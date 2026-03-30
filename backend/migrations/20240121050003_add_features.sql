-- Add missing features (users table already exists)

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

-- Create user_workspace_roles (users table should exist now)
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

-- Insert default admin user (if not exists)
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
