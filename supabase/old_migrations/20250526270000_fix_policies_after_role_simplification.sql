/*
  # Fix Policies After Role Simplification

  1. Changes
    - Update all policies to use is_super_admin() function
    - Remove role-based restrictions
    - Allow all authenticated users to access data
    - Keep super admin privileges for management
*/

-- Update policies for meetings
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;
CREATE POLICY "All users can view meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

-- Update policies for pain points
DROP POLICY IF EXISTS "Pain points are viewable by meeting creator" ON pain_points;
CREATE POLICY "All users can view pain points"
  ON pain_points FOR SELECT
  TO authenticated
  USING (true);

-- Update policies for follow ups
DROP POLICY IF EXISTS "Follow-ups are viewable by assigned user" ON follow_ups;
DROP POLICY IF EXISTS "Follow-ups are updatable by assigned user" ON follow_ups;
CREATE POLICY "All users can view follow ups"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own follow ups"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

-- Update policies for nx opportunities
DROP POLICY IF EXISTS "Nx opportunities are viewable by meeting creator" ON nx_opportunities;
CREATE POLICY "All users can view nx opportunities"
  ON nx_opportunities FOR SELECT
  TO authenticated
  USING (true);

-- Update policies for recurring issues
DROP POLICY IF EXISTS "Recurring issues are viewable by authenticated users" ON recurring_issues;
CREATE POLICY "All users can view recurring issues"
  ON recurring_issues FOR SELECT
  TO authenticated
  USING (true);

-- Update policies for companies
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON companies;
CREATE POLICY "All users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Add super admin management policies
CREATE POLICY "Super admins can manage meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage pain points"
  ON pain_points FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage follow ups"
  ON follow_ups FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage nx opportunities"
  ON nx_opportunities FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage recurring issues"
  ON recurring_issues FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Update user info view
CREATE OR REPLACE VIEW user_info AS
SELECT 
  au.id,
  au.email::text as email,
  au.created_at,
  au.last_sign_in_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM super_admins WHERE user_id = au.id) THEN 'super_admin'
    ELSE 'user'
  END as role
FROM auth.users au;

-- Update get_all_users function
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    ui.role,
    ui.created_at,
    ui.last_sign_in_at
  FROM user_info ui;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated; 