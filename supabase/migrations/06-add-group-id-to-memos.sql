-- Add group_id column to memos table

-- Add group_id column to memos table
ALTER TABLE memos 
ADD COLUMN group_id UUID;

-- Add foreign key constraint for group_id
ALTER TABLE memos 
ADD CONSTRAINT fk_memos_group_id 
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_memos_group_id ON memos(group_id);
