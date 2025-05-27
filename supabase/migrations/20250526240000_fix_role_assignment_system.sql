/*
  # Fix Role Assignment System

  1. Changes
    - Simplify role assignment policies
    - Update default role assignment trigger
    - Remove unnecessary error throwing
    - Ensure consistent default role (sales)
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can modify roles" ON user_roles;
DROP POLICY IF EXISTS "Allow system role assignment" ON user_roles;
DROP POLICY IF EXISTS "Allow role assignment for new users" ON user_roles;

-- Create simplified policies
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
  );

-- Allow system role assignment for new users
CREATE POLICY "Allow system role assignment"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Update the default role assignment function
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign role if user doesn't already have one
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = NEW.id
  ) THEN
    BEGIN
      -- Insert with explicit role
      INSERT INTO user_roles (user_id, role_id)
      VALUES (NEW.id, 'sales');
      
      -- Log the assignment
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (
        NEW.id,
        'role_assigned',
        jsonb_build_object(
          'role', 'sales',
          'assigned_by', 'system',
          'reason', 'Default role assignment'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Just log the error but don't fail the transaction
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

-- Update the get_user_role function to be more resilient
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
      ELSE 'sales'  -- Changed default from 'user' to 'sales'
    END;
$$; 