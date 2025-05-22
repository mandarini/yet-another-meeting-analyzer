/*
  # Initial Schema Setup

  1. New Tables
    - `companies`
      - Company information and Nx usage details
    - `meetings`
      - Meeting transcripts and metadata
    - `pain_points`
      - Issues identified during meetings
    - `follow_ups`
      - Action items from meetings
    - `nx_opportunities`
      - Potential Nx solutions
    - `recurring_issues`
      - Tracking recurring problems
    - `profiles`
      - User profiles linked to auth.users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE,
  nx_usage_level text DEFAULT 'none',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by authenticated users"
  ON companies FOR SELECT
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

CREATE POLICY "Users can view their own meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Create pain_points table
CREATE TABLE IF NOT EXISTS pain_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id),
  description text NOT NULL,
  urgency_score integer NOT NULL,
  category text NOT NULL,
  related_nx_features text[],
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pain_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pain points are viewable by meeting creator"
  ON pain_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = pain_points.meeting_id
      AND meetings.created_by = auth.uid()
    )
  );

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

CREATE POLICY "Follow-ups are viewable by assigned user"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Follow-ups are updatable by assigned user"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

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

CREATE POLICY "Nx opportunities are viewable by meeting creator"
  ON nx_opportunities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = nx_opportunities.meeting_id
      AND meetings.created_by = auth.uid()
    )
  );

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

CREATE POLICY "Recurring issues are viewable by authenticated users"
  ON recurring_issues FOR SELECT
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

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Add some sample companies
INSERT INTO companies (name, domain, nx_usage_level) VALUES
  ('Acme Inc.', 'acme.com', 'evaluating'),
  ('Globex Corporation', 'globex.com', 'basic'),
  ('Initech', 'initech.com', 'none'),
  ('Massive Dynamic', 'massive-dynamic.com', 'advanced')
ON CONFLICT (domain) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
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