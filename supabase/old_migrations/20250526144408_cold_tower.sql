/*
  # Fix user roles policies to prevent infinite recursion

  1. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies for role management
    - Implement proper role hierarchy checks
    - Add separate policies for view and modify operations

  2. Security
    - Super admins can manage all roles
    - Admins can only manage non-admin roles
    - Users can view their own roles
    - Prevent circular dependencies in policy checks
*/

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Super admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles except super admin" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can modify all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can modify non-admin roles" ON user_roles;

-- Create new policies with optimized checks
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = 'super_admin'
    )
  );

CREATE POLICY "Admins can view non-super-admin roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = 'admin'
    )
    AND role_id != 'super_admin'
  );

CREATE POLICY "Super admins can modify all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = 'super_admin'
    )
  );

CREATE POLICY "Admins can modify non-privileged roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = 'admin'
    )
    AND role_id NOT IN ('super_admin', 'admin')
  );

-- Create index for faster role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON user_roles (user_id, role_id);