-- Add identity_data column to identities table
ALTER TABLE auth.identities ADD COLUMN IF NOT EXISTS identity_data jsonb;

-- Create index on identity_data column
CREATE INDEX IF NOT EXISTS idx_identities_identity_data ON auth.identities USING gin (identity_data);