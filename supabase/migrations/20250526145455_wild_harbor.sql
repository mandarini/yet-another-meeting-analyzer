/*
  # Fix user info view and function

  1. Changes
    - Recreate user_info view with correct types
    - Update get_all_users function to match view types
    - Set proper permissions

  2. Security
    - Grant appropriate permissions to authenticated users
    - Function runs with security definer
*/

-- Safely drop existing objects
DO $$ 
BEGIN
  -- Drop view if it exists
  DROP VIEW IF EXISTS user_info;
  
  -- Drop function if it exists (with all possible signatures)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_users') THEN
    DROP FUNCTION IF EXISTS get_all_users();
  END IF;
END $$;

-- Create view with explicit type casting
CREATE OR REPLACE VIEW user_info AS
SELECT 
  au.id,
  au.email::text as email,
  au.created_at,
  au.last_sign_in_at,
  ur.role_id as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id;

-- Create function with matching types
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  role user_role,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    COALESCE(ui.role, 'user'::user_role) as role,
    ui.created_at,
    ui.last_sign_in_at
  FROM user_info ui;
END;
$$;

-- Set proper permissions
GRANT SELECT ON user_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

-- Ensure proper schema binding
ALTER VIEW user_info SET SCHEMA public;