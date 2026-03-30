-- ServiceAI Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    job_title VARCHAR(100),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verticals table
CREATE TABLE IF NOT EXISTS verticals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    features TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User vertical selections
CREATE TABLE IF NOT EXISTS user_verticals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vertical_id VARCHAR(50) REFERENCES verticals(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Service requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vertical_id VARCHAR(50) REFERENCES verticals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Assets/Inventory table
CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 10,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    location VARCHAR(255),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sku)
);

-- Inventory transactions table (tracks all inventory changes)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'return', 'transfer')),
    quantity_change INTEGER NOT NULL,
    reason TEXT,
    reference_id VARCHAR(255), -- PO number, sales order, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_verticals_user_id ON user_verticals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verticals_vertical_id ON user_verticals(vertical_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_vertical_id ON service_requests(vertical_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_sku ON assets(sku);
CREATE INDEX IF NOT EXISTS idx_assets_supplier ON assets(supplier);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_is_active ON assets(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_asset_id ON inventory_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);

-- Insert default verticals
INSERT INTO verticals (id, name, description, features, is_active) VALUES
('retail', 'Retail', 'Transform your retail operations with AI-powered customer insights and inventory optimization.', ARRAY['Smart Recommendations', 'Inventory Management', 'Customer Analytics'], true),
('restaurant', 'Restaurant', 'Streamline restaurant operations with intelligent order management and customer service.', ARRAY['Order Optimization', 'Menu Analytics', 'Staff Scheduling'], true),
('store-market', 'Marketplace', 'Optimize marketplace operations with AI-driven vendor management and customer insights.', ARRAY['Vendor Analytics', 'Price Optimization', 'Customer Segmentation'], true),
('business', 'Enterprise', 'Custom AI solutions tailored for your unique business needs and workflows.', ARRAY['Custom Workflows', 'Advanced Analytics', 'Enterprise Security'], true)
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verticals_updated_at BEFORE UPDATE ON verticals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Verticals are publicly readable
CREATE POLICY "Verticals are publicly readable" ON verticals FOR SELECT USING (true);

-- Users can only access their own vertical selections
CREATE POLICY "Users can view own vertical selections" ON user_verticals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vertical selections" ON user_verticals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vertical selections" ON user_verticals FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own service requests
CREATE POLICY "Users can view own service requests" ON service_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own service requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service requests" ON service_requests FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own assets
CREATE POLICY "Users can view own assets" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON assets FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own inventory transactions
CREATE POLICY "Users can view own inventory transactions" ON inventory_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory transactions" ON inventory_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- NEW TABLES FOR ADVANCED FEATURES
-- ============================================================================

-- Organizations table (for multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table (enhanced user management)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role_id INTEGER DEFAULT 3, -- 1=admin, 2=manager, 3=agent
    expertise_areas TEXT[],
    permissions JSONB DEFAULT '{}',
    current_workload INTEGER DEFAULT 0 CHECK (current_workload >= 0 AND current_workload <= 100),
    is_online BOOLEAN DEFAULT false,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team statistics table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    tickets_resolved INTEGER DEFAULT 0,
    avg_response_time DECIMAL(5,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service tickets table (enhanced)
CREATE TABLE IF NOT EXISTS service_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    assignee_id UUID REFERENCES team_members(id),
    created_by_id UUID REFERENCES team_members(id),
    category VARCHAR(100),
    tags TEXT[],
    ai_suggestion_id UUID, -- AI routing suggestion
    ai_confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- AI Workflows table
CREATE TABLE IF NOT EXISTS ai_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(100) NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_by_id UUID REFERENCES team_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_execution_at TIMESTAMP WITH TIME ZONE
);

-- AI Forms table
CREATE TABLE IF NOT EXISTS ai_forms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    form_name VARCHAR(255) NOT NULL,
    description TEXT,
    form_fields JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    submission_count INTEGER DEFAULT 0,
    created_by_id UUID REFERENCES team_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_submission_at TIMESTAMP WITH TIME ZONE
);

-- Analytics metrics tables
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    avg_response_time DECIMAL(5,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    total_queries INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    forms_completed INTEGER DEFAULT 0,
    workflow_executions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_request_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    high_priority_tickets INTEGER DEFAULT 0,
    avg_resolution_time DECIMAL(5,2) DEFAULT 0,
    cost_savings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    allow_guest_access BOOLEAN DEFAULT false,
    require_approval BOOLEAN DEFAULT true,
    max_team_size INTEGER DEFAULT 50,
    enable_service_ticket_communication BOOLEAN DEFAULT true,
    ai_accuracy_threshold INTEGER DEFAULT 85,
    auto_assign_tickets BOOLEAN DEFAULT true,
    enable_predictive_maintenance BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 365,
    enable_notifications BOOLEAN DEFAULT true,
    notification_email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- AI configurations table
CREATE TABLE IF NOT EXISTS ai_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    enable_intelligent_routing BOOLEAN DEFAULT true,
    enable_predictive_maintenance BOOLEAN DEFAULT true,
    enable_ai_creation BOOLEAN DEFAULT true,
    accuracy_threshold INTEGER DEFAULT 85,
    max_tokens_per_request INTEGER DEFAULT 1000,
    model_version VARCHAR(50) DEFAULT 'gpt-4',
    custom_prompts JSONB DEFAULT '{}',
    api_rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    total_users INTEGER DEFAULT 0,
    active_tickets INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    system_health INTEGER DEFAULT 85 CHECK (system_health >= 0 AND system_health <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES team_members(id),
    user_name VARCHAR(255),
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(100) NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default user roles
INSERT INTO user_roles (role_name, permissions, description) VALUES
('admin', '{"all": true}', 'Full system access and team management'),
('manager', '{"manage_team": true, "manage_tickets": true, "view_analytics": true}', 'Team oversight and ticket management'),
('agent', '{"resolve_tickets": true, "communicate": true, "view_own_analytics": true}', 'Ticket resolution and customer communication'),
('guest', '{"view_public": true}', 'Limited read-only access')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================================
-- CREATE INDEXES FOR NEW TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_team_members_organization_id ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role_id ON team_members(role_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_online ON team_members(is_online);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_organization_id ON service_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_priority ON service_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assignee_id ON service_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_organization_id ON ai_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_type ON ai_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_is_active ON ai_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_forms_organization_id ON ai_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_forms_is_active ON ai_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_system_metrics_organization_id ON system_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_organization_id ON activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_organization_id ON system_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_active ON system_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_organization_id ON integrations(organization_id);

-- ============================================================================
-- CREATE TRIGGERS FOR NEW TABLES
-- ============================================================================

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_tickets_updated_at BEFORE UPDATE ON service_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_workflows_updated_at BEFORE UPDATE ON ai_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_forms_updated_at BEFORE UPDATE ON ai_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_configurations_updated_at BEFORE UPDATE ON ai_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Organizations (admin only for now)
CREATE POLICY "Organizations are managed by admins" ON organizations FOR ALL USING (true);

-- Team members - organization-based access
CREATE POLICY "Team members can view own organization" ON team_members FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid()
));
CREATE POLICY "Admins can manage team members" ON team_members FOR ALL USING (role_id = 1);

-- Service tickets - organization-based access
CREATE POLICY "Users can view organization tickets" ON service_tickets FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid()
));
CREATE POLICY "Team members can manage tickets" ON service_tickets FOR ALL USING (assignee_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
));

-- AI Workflows - organization-based access
CREATE POLICY "Users can view organization workflows" ON ai_workflows FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid()
));
CREATE POLICY "Admins can manage workflows" ON ai_workflows FOR ALL USING (created_by_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid() AND role_id = 1
));

-- AI Forms - organization-based access
CREATE POLICY "Users can view organization forms" ON ai_forms FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid()
));
CREATE POLICY "Admins can manage forms" ON ai_forms FOR ALL USING (created_by_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid() AND role_id = 1
));

-- System settings - admin only
CREATE POLICY "Only admins can manage settings" ON system_settings FOR ALL USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND role_id = 1
));

-- Activity log - organization-based access
CREATE POLICY "Users can view organization activity" ON activity_log FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid()
));

-- System alerts - organization-based access
CREATE POLICY "Users can view organization alerts" ON system_alerts FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid()
));

-- AI configurations - admin only
CREATE POLICY "Only admins can manage AI config" ON ai_configurations FOR ALL USING (organization_id IN (
    SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND role_id = 1
));
