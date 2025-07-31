-- Create roles for NoteTree application

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create application roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public, auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public, auth TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public, auth TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public, auth TO anon;
