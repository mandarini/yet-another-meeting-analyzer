/*
  # Fix Role Assignment System

  1. Changes
    - Add policy to allow system role assignment
    - Fix default role assignment trigger
    - Ensure proper role hierarchy
*/

-- Drop existing policies that might interfere
DROP POLICY IF EXISTS "Allow role assignment for new users" ON user_roles;
DROP POLICY IF EXISTS "Super admins can do everything" ON user_roles;
DROP POLICY IF EXISTS "Admins can view and modify non-privileged roles" ON user_roles;

-- Create new policies with proper hierarchy
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

-- Add policy to allow system role assignment
CREATE POLICY "Allow system role assignment"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user has no roles yet (new user)
    NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
    )
    OR
    -- Allow if user is an admin
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('super_admin', 'admin')
    )
  );

-- Recreate the default role assignment function with proper error handling
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS trigger AS $$
BEGIN
  -- Only assign role if user doesn't have one
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, 'sales');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS assign_default_role_trigger ON auth.users;
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role(); 