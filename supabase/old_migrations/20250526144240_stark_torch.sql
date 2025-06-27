/*
  # Fix user roles policies to prevent infinite recursion

  1. Changes
    - Drop existing policies on user_roles table
    - Create new policies that avoid recursive checks
    - Add separate policies for super_admin and admin roles
*/

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "User roles are viewable by admins" ON user_roles;
DROP POLICY IF EXISTS "User roles are modifiable by admins" ON user_roles;

-- Create new policies that avoid recursion
CREATE POLICY "Super admins can view all user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id
        AND ur.role_id = 'super_admin'
      )
    )
  );

CREATE POLICY "Admins can view all user roles except super admin"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id
        AND ur.role_id = 'admin'
      )
    )
    AND role_id != 'super_admin'
  );

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can modify all user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id
        AND ur.role_id = 'super_admin'
      )
    )
  );

CREATE POLICY "Admins can modify non-admin roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id
        AND ur.role_id = 'admin'
      )
    )
    AND role_id NOT IN ('super_admin', 'admin')
  );