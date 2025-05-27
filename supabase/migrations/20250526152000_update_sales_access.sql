/*
  # Update Sales Team Access

  1. Changes
    - Update pain points policy to allow sales team access
    - Update meetings policy to allow sales team access
    - Keep follow-ups policy user-specific
    - Add helper function for role checks

  2. Security
    - Maintain existing security for non-sales users
    - Add role-based access for sales team
    - Keep follow-ups private to assigned users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Pain points are viewable by meeting creator" ON pain_points;
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;

-- Create helper function for role checks
CREATE OR REPLACE FUNCTION is_sales_team()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_id = 'sales'
  );
$$;

-- Create new policies for pain points
CREATE POLICY "Pain points are viewable by sales team and meeting creator"
  ON pain_points FOR SELECT
  TO authenticated
  USING (
    is_sales_team() OR
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = pain_points.meeting_id
      AND meetings.created_by = auth.uid()
    )
  );

-- Create new policies for meetings
CREATE POLICY "Meetings are viewable by sales team and creator"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    is_sales_team() OR
    auth.uid() = created_by
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_sales_team() TO authenticated; 