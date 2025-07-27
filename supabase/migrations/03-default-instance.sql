-- Insert default instance
INSERT INTO auth.instances (uuid, raw_base_config) 
VALUES (
    gen_random_uuid(),
    '{"site_url": "http://localhost:3000", "additional_redirect_urls": ["http://localhost:3000"], "jwt_expiry": 3600, "refresh_token_rotation_enabled": true, "security_update_password_require_reauthentication": true}'
) ON CONFLICT DO NOTHING; 
