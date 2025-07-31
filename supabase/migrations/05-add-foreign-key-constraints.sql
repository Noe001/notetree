-- Add foreign key constraints

-- Add foreign key constraint to memos table
ALTER TABLE memos 
ADD CONSTRAINT fk_memos_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint to groups table
ALTER TABLE groups 
ADD CONSTRAINT fk_groups_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint to group_members table
ALTER TABLE group_members 
ADD CONSTRAINT fk_group_members_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint to invitations table
ALTER TABLE invitations 
ADD CONSTRAINT fk_invitations_invited_by 
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE; 