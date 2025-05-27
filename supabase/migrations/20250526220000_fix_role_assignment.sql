/*
  # Fix Role Assignment Policies

  1. Changes
    - Add policy to allow role assignment for new users
    - Keep existing admin policies
    - Ensure default role assignment works
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "User roles are viewable by admins" ON user_roles;
DROP POLICY IF EXISTS "User roles are modifiable by admins" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can modify roles" ON user_roles;
DROP POLICY IF EXISTS "Allow role assignment for new users" ON user_roles;

-- Create new policies
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can modify roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('super_admin', 'admin')
    )
  );

-- Add policy to allow role assignment for new users
CREATE POLICY "Allow role assignment for new users"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  ); 