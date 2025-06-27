/*
  # Update Role-Based Access Control

  1. Changes
    - Update pain points policy to allow hierarchical role access
    - Update meetings policy to allow hierarchical role access
    - Keep follow-ups policy user-specific
    - Add helper function for role hierarchy checks

  2. Security
    - Implement role hierarchy: super_admin > admin > sales > user
    - Higher-level roles inherit privileges from lower-level roles
    - Keep follow-ups private to assigned users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Pain points are viewable by meeting creator" ON pain_points;
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;

-- Create helper function for role hierarchy checks
CREATE OR REPLACE FUNCTION has_privileged_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_id IN ('super_admin', 'admin', 'sales')
  );
$$;

-- Create new policies for pain points
CREATE POLICY "Pain points are viewable by privileged roles and meeting creator"
  ON pain_points FOR SELECT
  TO authenticated
  USING (
    has_privileged_role() OR
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = pain_points.meeting_id
      AND meetings.created_by = auth.uid()
    )
  );

-- Create new policies for meetings
CREATE POLICY "Meetings are viewable by privileged roles and creator"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    has_privileged_role() OR
    auth.uid() = created_by
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION has_privileged_role() TO authenticated; 