-- Add email_change_token_current column to users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_change_token_current varchar(255);