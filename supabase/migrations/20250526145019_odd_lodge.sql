/*
  # Fix user roles policies to prevent recursion

  1. Changes
    - Drop existing policies
    - Create new, simplified policies
    - Add efficient indexes
    - Fix infinite recursion in role checks

  2. Security
    - Maintain role-based access control
    - Prevent privilege escalation
    - Ensure data isolation
*/

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view non-super-admin roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can modify all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can modify non-privileged roles" ON user_roles;

-- Create new, simplified policies
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can do everything"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

CREATE POLICY "Admins can view and modify non-privileged roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND role_id NOT IN ('super_admin', 'admin')
  );

-- Create efficient indexes
DROP INDEX IF EXISTS idx_user_roles_user_role;
CREATE INDEX idx_user_roles_user_role ON user_roles (user_id, role_id);

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = 'super_admin') THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = 'admin') THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = 'sales') THEN 'sales'
      ELSE 'user'
    END;
$$;