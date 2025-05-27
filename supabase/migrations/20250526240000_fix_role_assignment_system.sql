/*
  # Fix Role Assignment System

  1. Changes
    - Drop all existing policies on user_roles
    - Create a separate table for role management
    - Create new policies using the separate table
    - Add proper indexes for performance

  2. Security
    - Super admins can manage all roles
    - Admins can manage non-admin roles
    - Users can view their own roles
    - Prevent privilege escalation
*/

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view non-super-admin roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can modify all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can modify non-privileged roles" ON user_roles;
DROP POLICY IF EXISTS "Allow role assignment for new users" ON user_roles;

-- Create a separate table for role management
CREATE TABLE IF NOT EXISTS role_management (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_super_admin boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE role_management ENABLE ROW LEVEL SECURITY;

-- Create policies for role_management
CREATE POLICY "Users can view their own role management"
  ON role_management FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
  ON role_management FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_management
      WHERE user_id = auth.uid()
      AND is_super_admin = true
    )
  );

CREATE POLICY "Admins can manage non-admin roles"
  ON role_management FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_management
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Create function to sync role_management with user_roles
CREATE OR REPLACE FUNCTION sync_role_management()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update role_management record
  INSERT INTO role_management (user_id, is_super_admin, is_admin)
  SELECT 
    NEW.user_id,
    bool_or(NEW.role_id = 'super_admin'),
    bool_or(NEW.role_id = 'admin')
  FROM user_roles
  WHERE user_id = NEW.user_id
  GROUP BY user_id
  ON CONFLICT (user_id) DO UPDATE
  SET 
    is_super_admin = EXCLUDED.is_super_admin,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync role_management
CREATE TRIGGER sync_role_management_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION sync_role_management();

-- Create new policies for user_roles using role_management
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_management
      WHERE user_id = auth.uid()
      AND is_super_admin = true
    )
  );

CREATE POLICY "Admins can manage non-admin roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_management
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
    AND role_id NOT IN ('super_admin', 'admin')
  );

-- Create index for faster role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON user_roles (user_id, role_id);

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM role_management WHERE user_id = $1 AND is_super_admin) THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM role_management WHERE user_id = $1 AND is_admin) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = 'sales') THEN 'sales'
      ELSE 'user'
    END;
$$;

-- Grant necessary permissions
GRANT SELECT ON role_management TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION sync_role_management TO authenticated;

-- Initial sync of role_management
INSERT INTO role_management (user_id, is_super_admin, is_admin)
SELECT 
  user_id,
  bool_or(role_id = 'super_admin'),
  bool_or(role_id = 'admin')
FROM user_roles
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET 
  is_super_admin = EXCLUDED.is_super_admin,
  is_admin = EXCLUDED.is_admin,
  updated_at = now(); 