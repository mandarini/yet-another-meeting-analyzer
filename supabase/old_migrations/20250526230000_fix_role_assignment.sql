/*
  # Fix Role Assignment System

  1. Changes
    - Update role system to use super_admins table only
    - Remove user_roles references
    - Ensure proper role hierarchy
*/

-- Create super_admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view super admin status" ON super_admins;
DROP POLICY IF EXISTS "Only super admins can manage super admins" ON super_admins;

-- Create policies for super_admins
CREATE POLICY "Users can view super admin status"
  ON super_admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only super admins can manage super admins"
  ON super_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = $1
  );
$$;

-- Create function to get user role (simplified)
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM super_admins WHERE user_id = $1) THEN 'super_admin'
      ELSE 'user'
    END;
$$;

-- Grant necessary permissions
GRANT SELECT ON super_admins TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated; 