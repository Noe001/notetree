-- Additional authentication tables for NoteTree application

-- Create auth schema and tables
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table for authentication in auth schema (complete Supabase schema)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aud VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    invited_at TIMESTAMP WITH TIME ZONE,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMP WITH TIME ZONE,
    email_change_token VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone VARCHAR(15) UNIQUE,
    phone_confirmed_at TIMESTAMP WITH TIME ZONE,
    phone_change VARCHAR(15),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMP WITH TIME ZONE,
    email_change_confirm_status SMALLINT DEFAULT 0 CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2),
    instance_id UUID,
    banned_until TIMESTAMP WITH TIME ZONE,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    email_change_token_new VARCHAR(255),
    phone_change_token_new VARCHAR(255)
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create instances table
CREATE TABLE IF NOT EXISTS auth.instances (
    id UUID PRIMARY KEY,
    uuid UUID,
    raw_base_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_log_entries table
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
    id UUID PRIMARY KEY,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID, -- Will reference auth.users(id) after auth schema is created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID, -- Will reference auth.users(id) after auth schema is created
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    invited_by UUID, -- Will reference auth.users(id) after auth schema is created
    role VARCHAR(50) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_instance_id_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_instance_id_phone ON auth.users(phone);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_token ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_group_id ON invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
