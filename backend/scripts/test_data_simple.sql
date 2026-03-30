-- Simple test data for the new setup

-- Create a sample object
INSERT INTO objects (object_type_id, workspace_id, name, status, custom_fields)
SELECT 
    (SELECT object_type_id FROM object_types WHERE name = 'asset' LIMIT 1),
    (SELECT workspace_id FROM workspaces LIMIT 1),
    'Sample Laptop',
    'active',
    '{"brand": "Dell", "model": "XPS 15", "serial_number": "DEMO-001"}'
ON CONFLICT DO NOTHING;

-- Create a sample service request
INSERT INTO service_requests (workspace_id, type, status, priority, description)
SELECT 
    (SELECT workspace_id FROM workspaces LIMIT 1),
    'maintenance',
    'pending',
    'medium',
    'Sample maintenance request'
ON CONFLICT DO NOTHING;

-- Verify data
SELECT * FROM objects LIMIT 5;
SELECT * FROM service_requests LIMIT 5;
