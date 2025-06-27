/*
  # Simplify Role System to Super Admin Only

  1. Changes
    - Drop all existing role-related tables and policies
    - Create a simple super_admin table
    - Create basic policies for super admin access
    - Remove all other role-related complexity

  2. Security
    - Only super admins have special privileges
    - All other users have standard access
*/

-- Create a simple super_admin table
CREATE TABLE IF NOT EXISTS super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

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

-- Migrate existing super admins if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    INSERT INTO super_admins (user_id)
    SELECT DISTINCT user_id
    FROM user_roles
    WHERE role_id = 'super_admin'
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Drop all existing role-related objects after migration
DROP TABLE IF EXISTS role_management CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE; 