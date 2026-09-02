-- OBSOLETE — do not run on a new Supabase project.
-- Canonical MVP schema (SCRUM-28):
--   db/migrations/20240207000000_complete_setup.sql
-- Users are now public.profiles referencing auth.users (no password_hash).
-- This incremental dump is kept only for historical reference.

-- Create users table first
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

-- Insert default admin user
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
