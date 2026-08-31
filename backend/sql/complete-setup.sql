-- Complete the database setup

-- Create default workspace
INSERT INTO workspaces (tenant_id, name, description, metadata)
SELECT 
    (SELECT tenant_id FROM tenants WHERE name = 'Default Tenant' LIMIT 1),
    'Default Workspace',
    'Default workspace for demo',
    '{"type": "demo"}'
ON CONFLICT DO NOTHING;

-- Create default schema
INSERT INTO schemas (workspace_id, name, description)
SELECT 
    (SELECT workspace_id FROM workspaces WHERE name = 'Default Workspace' LIMIT 1),
    'Default Schema',
    'Default schema for demo'
ON CONFLICT DO NOTHING;

-- Insert admin user
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Add sample objects
INSERT INTO objects (object_type_id, workspace_id, name, status, custom_fields)
SELECT 
    (SELECT object_type_id FROM object_types WHERE name = 'asset' LIMIT 1),
    (SELECT workspace_id FROM workspaces WHERE name = 'Default Workspace' LIMIT 1),
    'Sample Laptop',
    'active',
    '{"brand": "Dell", "model": "XPS 15", "serial_number": "DEMO-001"}'
ON CONFLICT DO NOTHING;

INSERT INTO objects (object_type_id, workspace_id, name, status, custom_fields)
SELECT 
    (SELECT object_type_id FROM object_types WHERE name = 'location' LIMIT 1),
    (SELECT workspace_id FROM workspaces WHERE name = 'Default Workspace' LIMIT 1),
    'Main Office',
    'active',
    '{"address": "123 Main St", "city": "Anytown", "state": "CA"}'
ON CONFLICT DO NOTHING;

-- Create a sample service request
INSERT INTO service_requests (workspace_id, type, status, priority, description)
SELECT 
    (SELECT workspace_id FROM workspaces WHERE name = 'Default Workspace' LIMIT 1),
    'maintenance',
    'pending',
    'medium',
    'Sample maintenance request for demo'
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Setup Complete' as status;
