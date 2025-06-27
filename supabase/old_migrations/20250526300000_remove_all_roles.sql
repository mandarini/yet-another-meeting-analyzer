/*
  # Remove All Role Logic

  1. Changes
    - Drop all role-related tables and functions
    - Remove all role-based policies
    - Simplify to basic authenticated user access
*/

-- Drop role-related tables
DROP TABLE IF EXISTS super_admins CASCADE;
DROP TABLE IF EXISTS role_management CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop role-related functions
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_privileged_role() CASCADE;
DROP FUNCTION IF EXISTS sync_role_management() CASCADE;
DROP FUNCTION IF EXISTS assign_default_role() CASCADE;

-- Drop existing functions that need to be recreated
DROP FUNCTION IF EXISTS get_all_users() CASCADE;

-- Update user_info view to remove role information
CREATE OR REPLACE VIEW user_info AS
SELECT 
  au.id,
  au.email::text as email,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au;

-- Create new get_all_users function without role information
CREATE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
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
    ui.created_at,
    ui.last_sign_in_at
  FROM user_info ui;
END;
$$;

-- Update policies for meetings
DROP POLICY IF EXISTS "Super admins can manage meetings" ON meetings;
CREATE POLICY "All authenticated users can manage meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (true);

-- Update policies for pain points
DROP POLICY IF EXISTS "Super admins can manage pain points" ON pain_points;
CREATE POLICY "All authenticated users can manage pain points"
  ON pain_points FOR ALL
  TO authenticated
  USING (true);

-- Update policies for follow ups
DROP POLICY IF EXISTS "Super admins can manage follow ups" ON follow_ups;
CREATE POLICY "All authenticated users can manage follow ups"
  ON follow_ups FOR ALL
  TO authenticated
  USING (true);

-- Update policies for nx opportunities
DROP POLICY IF EXISTS "Super admins can manage nx opportunities" ON nx_opportunities;
CREATE POLICY "All authenticated users can manage nx opportunities"
  ON nx_opportunities FOR ALL
  TO authenticated
  USING (true);

-- Update policies for recurring issues
DROP POLICY IF EXISTS "Super admins can manage recurring issues" ON recurring_issues;
CREATE POLICY "All authenticated users can manage recurring issues"
  ON recurring_issues FOR ALL
  TO authenticated
  USING (true);

-- Update policies for companies
DROP POLICY IF EXISTS "Super admins can manage companies" ON companies;
CREATE POLICY "All authenticated users can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated; 