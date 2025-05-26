-- Create a view for user information
CREATE OR REPLACE VIEW user_info AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  ur.role_id as role
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id;

-- Create function to get all users with roles
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    COALESCE(ui.role, 'user')::text as role,
    ui.created_at,
    ui.last_sign_in_at
  FROM user_info ui;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;