-- Default instance data for NoteTree application

-- Insert default user for testing
INSERT INTO auth.users (id, email, raw_user_meta_data) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', '{"name": "Test User"}')
ON CONFLICT (email) DO NOTHING;

-- Insert default group for testing
INSERT INTO groups (id, name, description, created_by)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Group', 'Default test group', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Insert default group member
INSERT INTO group_members (group_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin')
ON CONFLICT DO NOTHING;

-- Insert default memo for testing
INSERT INTO memos (id, user_id, title, content)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Welcome to NoteTree', 'This is your first memo in NoteTree application!')
ON CONFLICT DO NOTHING;
