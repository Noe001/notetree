-- Additional tables required by Supabase Auth

-- Instances table
CREATE TABLE IF NOT EXISTS auth.instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid uuid UNIQUE NOT NULL,
    raw_base_config text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- MFA factors table
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    friendly_name text,
    factor_type text NOT NULL,
    status text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- MFA challenges table
CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    factor_id uuid REFERENCES auth.mfa_factors(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    verified_at timestamptz,
    ip_address inet
);

-- SAML providers table
CREATE TABLE IF NOT EXISTS auth.saml_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- SSO providers table
CREATE TABLE IF NOT EXISTS auth.sso_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id uuid REFERENCES auth.instances(id) ON DELETE CASCADE,
    resource_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- SAML relay states table
CREATE TABLE IF NOT EXISTS auth.saml_relay_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS mfa_factors_user_id_idx ON auth.mfa_factors(user_id);
CREATE INDEX IF NOT EXISTS mfa_challenges_factor_id_idx ON auth.mfa_challenges(factor_id);
CREATE INDEX IF NOT EXISTS saml_providers_sso_provider_id_idx ON auth.saml_providers(sso_provider_id);
CREATE INDEX IF NOT EXISTS sso_providers_instance_id_idx ON auth.sso_providers(instance_id);
CREATE INDEX IF NOT EXISTS saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states(sso_provider_id); 
