-- Test Data for the Workflow System
-- Run this after migrations are complete

-- Create test tenant
INSERT INTO tenants (name, metadata, status)
VALUES ('Tech Solutions Inc', '{"industry": "Technology", "size": "medium"}', 'active')
ON CONFLICT DO NOTHING;

-- Get the tenant ID (you'll need to replace this with actual ID)
-- For now, let's assume it's the first tenant

-- Create test workspaces
INSERT INTO workspaces (tenant_id, name, description, metadata)
SELECT 
    (SELECT tenant_id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1),
    'IT Department',
    'Information Technology workspace',
    '{"department_code": "IT", "budget": 500000}'
ON CONFLICT DO NOTHING;

INSERT INTO workspaces (tenant_id, name, description, metadata)
SELECT 
    (SELECT tenant_id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1),
    'Operations',
    'Operations and fleet management',
    '{"department_code": "OPS", "budget": 300000}'
ON CONFLICT DO NOTHING;

-- Create schemas
INSERT INTO schemas (workspace_id, name, description)
SELECT 
    (SELECT workspace_id FROM workspaces WHERE name = 'IT Department' LIMIT 1),
    'IT Assets',
    'IT equipment and software assets'
ON CONFLICT DO NOTHING;

INSERT INTO schemas (workspace_id, name, description)
SELECT 
    (SELECT workspace_id FROM workspaces WHERE name = 'Operations' LIMIT 1),
    'Fleet Management',
    'Vehicle and equipment management'
ON CONFLICT DO NOTHING;

-- Create object types with schema definitions
INSERT INTO object_types (schema_id, name, description, schema_definition, is_system)
SELECT 
    (SELECT schema_id FROM schemas WHERE name = 'IT Assets' LIMIT 1),
    'laptop',
    'Company laptops and mobile workstations',
    '{
        "attributes": {
            "serial_number": {
                "type": "text",
                "required": true,
                "unique": true
            },
            "brand": {
                "type": "text",
                "required": true,
                "options": ["Apple", "Dell", "HP", "Lenovo"]
            },
            "model": {
                "type": "text",
                "required": true
            },
            "status": {
                "type": "select",
                "options": ["available", "in_use", "maintenance", "retired"],
                "default": "available"
            },
            "assigned_to": {
                "type": "relation",
                "target_type": "user"
            },
            "location": {
                "type": "relation",
                "target_type": "location"
            }
        }
    }',
    false
ON CONFLICT DO NOTHING;

INSERT INTO object_types (schema_id, name, description, schema_definition, is_system)
SELECT 
    (SELECT schema_id FROM schemas WHERE name = 'Fleet Management' LIMIT 1),
    'vehicle',
    'Company vehicles for operations',
    '{
        "attributes": {
            "vehicle_id": {
                "type": "text",
                "required": true,
                "unique": true
            },
            "make": {
                "type": "text",
                "required": true
            },
            "model": {
                "type": "text",
                "required": true
            },
            "year": {
                "type": "number",
                "required": true
            },
            "status": {
                "type": "select",
                "options": ["available", "in_use", "maintenance", "out_of_service"],
                "default": "available"
            },
            "mileage": {
                "type": "number"
            },
            "assigned_driver": {
                "type": "relation",
                "target_type": "user"
            }
        }
    }',
    false
ON CONFLICT DO NOTHING;

-- Create sample objects
INSERT INTO objects (object_type_id, workspace_id, name, status, custom_fields)
SELECT 
    (SELECT object_type_id FROM object_types WHERE name = 'laptop' LIMIT 1),
    (SELECT workspace_id FROM workspaces WHERE name = 'IT Department' LIMIT 1),
    'Dell XPS 15 - John Doe',
    'in_use',
    '{
        "serial_number": "DELL-2023-001",
        "brand": "Dell",
        "model": "XPS 15",
        "assigned_to": "john.doe@techsolutions.com",
        "location": "office-main",
        "purchase_date": "2023-01-15",
        "warranty_expiry": "2025-01-15"
    }'
ON CONFLICT DO NOTHING;

INSERT INTO objects (object_type_id, workspace_id, name, status, custom_fields)
SELECT 
    (SELECT object_type_id FROM object_types WHERE name = 'vehicle' LIMIT 1),
    (SELECT workspace_id FROM workspaces WHERE name = 'Operations' LIMIT 1),
    'Delivery Van #1',
    'in_use',
    '{
        "vehicle_id": "DV-001",
        "make": "Ford",
        "model": "Transit",
        "year": 2022,
        "mileage": 45000,
        "assigned_driver": "mike.smith@techsolutions.com",
        "last_maintenance": "2024-01-10"
    }'
ON CONFLICT DO NOTHING;

-- Create object relations
INSERT INTO object_relations (from_object_id, to_object_id, relation_type, metadata)
SELECT 
    (SELECT object_id FROM objects WHERE name = 'Dell XPS 15 - John Doe' LIMIT 1),
    (SELECT user_id FROM users WHERE email = 'admin@example.com' LIMIT 1),
    'assigned_to',
    '{"assigned_date": "2023-01-15", "assigned_by": "admin"}'
ON CONFLICT DO NOTHING;

-- Create sample service request
INSERT INTO service_requests (workspace_id, type, status, priority, description, related_item_object_id)
SELECT 
    (SELECT workspace_id FROM workspaces WHERE name = 'IT Department' LIMIT 1),
    'maintenance',
    'pending',
    'medium',
    'Laptop needs keyboard replacement',
    (SELECT object_id FROM objects WHERE name = 'Dell XPS 15 - John Doe' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Create sample stock transaction
INSERT INTO stock_transactions (workspace_id, item_object_id, qty_delta, reason)
SELECT 
    (SELECT workspace_id FROM workspaces WHERE name = 'IT Department' LIMIT 1),
    (SELECT object_id FROM objects WHERE name = 'Dell XPS 15 - John Doe' LIMIT 1),
    1,
    'Initial inventory'
ON CONFLICT DO NOTHING;
