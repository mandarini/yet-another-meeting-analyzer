/*
  # Fix Super Admin Policy

  1. Changes
    - Fix infinite recursion in super_admins policy
    - Use JWT role claims for role checks
    - Update is_super_admin function to use JWT
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view super admin status" ON super_admins;
DROP POLICY IF EXISTS "Only super admins can manage super admins" ON super_admins;

-- Create new policies using JWT role claims
CREATE POLICY "Users can view super admin status"
ON super_admins
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only super admins can manage super admins"
ON super_admins
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'super_admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'super_admin'
);

-- Update is_super_admin function to use JWT
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'role')::text = 'super_admin';
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated; 