-- Add last_sign_in_at column to identities table
ALTER TABLE auth.identities ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;