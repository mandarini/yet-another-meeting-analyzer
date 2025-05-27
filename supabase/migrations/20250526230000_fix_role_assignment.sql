/*
  # Fix Role Assignment System

  1. Changes
    - Add policy to allow system role assignment
    - Fix default role assignment trigger
    - Ensure proper role hierarchy
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can modify roles" ON user_roles;
DROP POLICY IF EXISTS "Allow system role assignment" ON user_roles;
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
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can modify roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('super_admin', 'admin')
    )
  );

-- Allow system role assignment for new users or by admins
CREATE POLICY "Allow system role assignment"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user doesn't have a role yet (new user)
    NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
    )
    OR
    -- Or if the current user is an admin
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('super_admin', 'admin')
    )
  );

-- Recreate the default role assignment function with better error handling
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign role if user doesn't already have one
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = NEW.id
  ) THEN
    BEGIN
      INSERT INTO user_roles (user_id, role_id)
      VALUES (NEW.id, 'sales');
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Failed to assign default role: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS assign_default_role_trigger ON auth.users;
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role(); 