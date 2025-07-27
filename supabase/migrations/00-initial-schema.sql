
CREATE SCHEMA IF NOT EXISTS auth;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aud varchar(255),
    role varchar(255),
    email varchar(255) UNIQUE,
    encrypted_password varchar(255),
    email_confirmed_at timestamptz,
    phone varchar(15) UNIQUE,
    phone_confirmed_at timestamptz,
    phone_change varchar(15),
    phone_change_token varchar(255),
    phone_change_sent_at timestamptz,
    confirmation_token varchar(255),
    confirmation_sent_at timestamptz,
    recovery_token varchar(255),
    recovery_sent_at timestamptz,
    email_change_token_new varchar(255),
    email_change varchar(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_sso_user boolean DEFAULT FALSE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token varchar(255) UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    revoked boolean DEFAULT FALSE,
    parent varchar(255) NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT refresh_tokens_parent_fkey FOREIGN KEY (parent) REFERENCES auth.refresh_tokens(token)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    not_after timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Identities table
CREATE TABLE IF NOT EXISTS auth.identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_data jsonb,
    provider varchar(255),
    last_sign_in_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS refresh_tokens_parent_idx ON auth.refresh_tokens(parent);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities(user_id);
CREATE INDEX IF NOT EXISTS identities_provider_idx ON auth.identities(provider);
