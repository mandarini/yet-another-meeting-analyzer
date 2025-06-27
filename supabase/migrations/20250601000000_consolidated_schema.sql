/*
  # Consolidated Schema & Access Control

  This migration consolidates all previous schema, business logic, and access control changes into a single, clean migration. It:
    - Drops all legacy role/role-management tables, types, and functions
    - Creates the minimal super_admins table and policies (optional)
    - Updates all policies to allow authenticated users, with super admin management
    - Recreates user_info view and get_all_users function
    - Includes all business logic (meeting functions, duplicate company handling, triggers, etc.)

  Use this migration for all new setups. Legacy migrations are kept in the 'old_migrations' folder for reference only.
*/

-- Drop legacy role/role-management
DROP TABLE IF EXISTS super_admins CASCADE;
DROP TABLE IF EXISTS role_management CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_privileged_role() CASCADE;
DROP FUNCTION IF EXISTS sync_role_management() CASCADE;
DROP FUNCTION IF EXISTS assign_default_role() CASCADE;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE,
  nx_usage_level text DEFAULT 'none',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  normalized_name text GENERATED ALWAYS AS (normalize_company_name(name)) STORED,
  technologies_used text[],
  nx_version text,
  years_using_nx text,
  workspace_size text,
  ci_provider text,
  nx_cloud_usage text,
  nx_adoption_approach text,
  satisfaction_nx numeric,
  satisfaction_nx_cloud numeric,
  agents_usage text,
  mfe_usage text,
  crystal_usage text,
  atomizer_usage text
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (true);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz NOT NULL,
  title text NOT NULL,
  company_id uuid REFERENCES companies(id),
  participants text[] NOT NULL,
  transcript_raw text NOT NULL,
  transcript_processed jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can manage meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (true);

-- Create pain_points table
CREATE TABLE IF NOT EXISTS pain_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id),
  description text NOT NULL,
  urgency_score integer NOT NULL,
  category text NOT NULL,
  related_nx_features text[],
  status text DEFAULT 'active',
  is_main_pain boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE pain_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can manage pain points"
  ON pain_points FOR ALL
  TO authenticated
  USING (true);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id),
  description text NOT NULL,
  deadline timestamptz NOT NULL,
  status text DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can manage follow ups"
  ON follow_ups FOR ALL
  TO authenticated
  USING (true);

-- Create nx_opportunities table
CREATE TABLE IF NOT EXISTS nx_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id),
  pain_point_id uuid REFERENCES pain_points(id),
  nx_feature text NOT NULL,
  confidence_score float NOT NULL,
  suggested_approach text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE nx_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can manage nx opportunities"
  ON nx_opportunities FOR ALL
  TO authenticated
  USING (true);

-- Create recurring_issues table
CREATE TABLE IF NOT EXISTS recurring_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  description text NOT NULL,
  occurrences jsonb NOT NULL,
  status text DEFAULT 'active',
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE recurring_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can manage recurring issues"
  ON recurring_issues FOR ALL
  TO authenticated
  USING (true);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text,
  role text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can manage profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (true);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pain_points_updated_at
  BEFORE UPDATE ON pain_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nx_opportunities_updated_at
  BEFORE UPDATE ON nx_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_issues_updated_at
  BEFORE UPDATE ON recurring_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add normalized_name logic for companies
CREATE OR REPLACE FUNCTION normalize_company_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(regexp_replace(lower($1), '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION update_company_normalized_name()
RETURNS trigger AS $$
BEGIN
  NEW.normalized_name := normalize_company_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_normalized_name_trigger
  BEFORE INSERT OR UPDATE OF name ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_normalized_name();

-- Merge duplicate companies logic
CREATE OR REPLACE FUNCTION merge_duplicate_companies()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  duplicate RECORD;
  target_id uuid;
  source_id uuid;
  merged_technologies text[];
  merged_nx_version text;
  merged_years_using_nx text;
  merged_workspace_size text;
  merged_ci_provider text;
  merged_nx_cloud_usage text;
  merged_nx_adoption_approach text;
  merged_satisfaction_nx numeric;
  merged_satisfaction_nx_cloud numeric;
  merged_agents_usage text;
  merged_mfe_usage text;
  merged_crystal_usage text;
  merged_atomizer_usage text;
  target_technologies text[];
BEGIN
  FOR duplicate IN 
    SELECT normalized_name, array_agg(id ORDER BY created_at) as ids
    FROM companies
    GROUP BY normalized_name
    HAVING count(*) > 1
  LOOP
    target_id := duplicate.ids[1];
    SELECT technologies_used INTO target_technologies FROM companies WHERE id = target_id;
    FOR i IN 2..array_length(duplicate.ids, 1) LOOP
      source_id := duplicate.ids[i];
      SELECT 
        technologies_used,
        nx_version,
        years_using_nx,
        workspace_size,
        ci_provider,
        nx_cloud_usage,
        nx_adoption_approach,
        satisfaction_nx,
        satisfaction_nx_cloud,
        agents_usage,
        mfe_usage,
        crystal_usage,
        atomizer_usage
      INTO 
        merged_technologies,
        merged_nx_version,
        merged_years_using_nx,
        merged_workspace_size,
        merged_ci_provider,
        merged_nx_cloud_usage,
        merged_nx_adoption_approach,
        merged_satisfaction_nx,
        merged_satisfaction_nx_cloud,
        merged_agents_usage,
        merged_mfe_usage,
        merged_crystal_usage,
        merged_atomizer_usage
      FROM companies WHERE id = source_id;
      IF merged_technologies IS NOT NULL THEN
        target_technologies := array(
          SELECT DISTINCT unnest(target_technologies || merged_technologies)
        );
      END IF;
      UPDATE companies SET
        technologies_used = target_technologies,
        nx_version = COALESCE((SELECT nx_version FROM companies WHERE id = target_id), merged_nx_version),
        years_using_nx = GREATEST(COALESCE((SELECT years_using_nx FROM companies WHERE id = target_id), '0'), COALESCE(merged_years_using_nx, '0')),
        workspace_size = COALESCE((SELECT workspace_size FROM companies WHERE id = target_id), merged_workspace_size),
        ci_provider = COALESCE((SELECT ci_provider FROM companies WHERE id = target_id), merged_ci_provider),
        nx_cloud_usage = COALESCE((SELECT nx_cloud_usage FROM companies WHERE id = target_id), merged_nx_cloud_usage),
        nx_adoption_approach = COALESCE((SELECT nx_adoption_approach FROM companies WHERE id = target_id), merged_nx_adoption_approach),
        satisfaction_nx = (COALESCE((SELECT satisfaction_nx FROM companies WHERE id = target_id), 0) + COALESCE(merged_satisfaction_nx, 0)) / 2,
        satisfaction_nx_cloud = (COALESCE((SELECT satisfaction_nx_cloud FROM companies WHERE id = target_id), 0) + COALESCE(merged_satisfaction_nx_cloud, 0)) / 2,
        agents_usage = COALESCE((SELECT agents_usage FROM companies WHERE id = target_id), merged_agents_usage),
        mfe_usage = COALESCE((SELECT mfe_usage FROM companies WHERE id = target_id), merged_mfe_usage),
        crystal_usage = COALESCE((SELECT crystal_usage FROM companies WHERE id = target_id), merged_crystal_usage),
        atomizer_usage = COALESCE((SELECT atomizer_usage FROM companies WHERE id = target_id), merged_atomizer_usage)
      WHERE id = target_id;
      UPDATE meetings SET company_id = target_id WHERE company_id = source_id;
      DELETE FROM companies WHERE id = source_id;
    END LOOP;
  END LOOP;
END;
$$;

SELECT merge_duplicate_companies();
ALTER TABLE companies ADD CONSTRAINT companies_normalized_name_key UNIQUE (normalized_name);

-- Super admins table and policies
CREATE TABLE IF NOT EXISTS super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
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
GRANT SELECT ON super_admins TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;

-- user_info view and get_all_users function
CREATE OR REPLACE VIEW user_info AS
SELECT 
  au.id,
  au.email::text as email,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au;
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
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
    ui.created_at,
    ui.last_sign_in_at
  FROM user_info ui;
END;
$$;
GRANT SELECT ON user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- Business logic: meeting functions
-- match_pain_points
CREATE OR REPLACE FUNCTION match_pain_points(
  query_embedding vector(1536),
  similarity_threshold float,
  company_id uuid
)
RETURNS TABLE (
  id uuid,
  description text,
  urgency_score integer,
  category text,
  meeting_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.description,
    p.urgency_score,
    p.category,
    p.meeting_id,
    p.created_at,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM pain_points p
  JOIN meetings m ON p.meeting_id = m.id
  WHERE 
    m.company_id = match_pain_points.company_id
    AND 1 - (p.embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC;
END;
$$;
-- match_all_pain_points
CREATE OR REPLACE FUNCTION match_all_pain_points(
  _query_embedding vector(1536),
  _similarity_threshold float,
  _match_count int
)
RETURNS TABLE (
  pain_point_id UUID,
  meeting_id UUID,
  company_name TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id as pain_point_id,
    pp.meeting_id,
    c.name as company_name,
    m.date as meeting_date,
    pp.description,
    1 - (pp.embedding <=> _query_embedding) as similarity
  FROM
    pain_points pp
    JOIN meetings m ON pp.meeting_id = m.id
    JOIN companies c ON m.company_id = c.id
  WHERE
    pp.embedding IS NOT NULL
    AND 1 - (pp.embedding <=> _query_embedding) > _similarity_threshold
  ORDER BY
    similarity DESC
  LIMIT _match_count;
END;
$$;
-- get_meetings_with_company
CREATE OR REPLACE FUNCTION get_meetings_with_company()
RETURNS TABLE (
  id uuid,
  date timestamptz,
  title text,
  company_id uuid,
  company_name text,
  participants text[],
  created_by uuid,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.date,
    m.title,
    m.company_id,
    c.name as company_name,
    m.participants,
    m.created_by,
    m.created_at
  FROM meetings m
  JOIN companies c ON m.company_id = c.id
  ORDER BY m.date DESC;
$$;
-- get_meeting_details
CREATE OR REPLACE FUNCTION get_meeting_details(meeting_id uuid)
RETURNS TABLE (
  id uuid,
  date timestamptz,
  title text,
  company_id uuid,
  company_name text,
  participants text[],
  transcript_raw text,
  transcript_processed jsonb,
  created_by uuid,
  created_at timestamptz,
  pain_points jsonb,
  follow_ups jsonb,
  nx_opportunities jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.date,
    m.title,
    m.company_id,
    c.name as company_name,
    m.participants,
    m.transcript_raw,
    m.transcript_processed,
    m.created_by,
    m.created_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pp.id,
            'description', pp.description,
            'urgency_score', pp.urgency_score,
            'category', pp.category,
            'related_nx_features', pp.related_nx_features,
            'status', pp.status,
            'created_at', pp.created_at
          )
        )
        FROM pain_points pp
        WHERE pp.meeting_id = m.id
      ),
      '[]'::jsonb
    ) as pain_points,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', fu.id,
            'description', fu.description,
            'deadline', fu.deadline,
            'status', fu.status,
            'assigned_to', fu.assigned_to,
            'created_at', fu.created_at
          )
        )
        FROM follow_ups fu
        WHERE fu.meeting_id = m.id
      ),
      '[]'::jsonb
    ) as follow_ups,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', no.id,
            'nx_feature', no.nx_feature,
            'confidence_score', no.confidence_score,
            'suggested_approach', no.suggested_approach,
            'created_at', no.created_at
          )
        )
        FROM nx_opportunities no
        WHERE no.meeting_id = m.id
      ),
      '[]'::jsonb
    ) as nx_opportunities
  FROM meetings m
  JOIN companies c ON m.company_id = c.id
  WHERE m.id = get_meeting_details.meeting_id;
END;
$$; 