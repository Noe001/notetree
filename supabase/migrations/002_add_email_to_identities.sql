-- Add email column to identities table
ALTER TABLE auth.identities ADD COLUMN IF NOT EXISTS email varchar(255);

-- Create index on email column
CREATE INDEX IF NOT EXISTS idx_identities_email ON auth.identities(email);