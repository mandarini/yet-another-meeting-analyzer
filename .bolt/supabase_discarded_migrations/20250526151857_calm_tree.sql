/*
  # Add company columns and global pain point matching

  1. New Columns
    - Add Nx-specific columns to companies table
    - Add usage tracking columns with constraints
    - Add satisfaction score columns
    - Add advanced feature usage columns

  2. Functions
    - Create global pain point matching function
    - Set up proper security and permissions

  3. Security
    - Add appropriate constraints for all new columns
    - Set up secure search path
    - Grant necessary permissions
*/

-- Add new columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS technologies_used text[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nx_version text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS years_using_nx text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_size text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ci_provider text;

-- Add Nx Cloud usage columns with constraints
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nx_cloud_usage text DEFAULT 'unknown';
ALTER TABLE companies ADD CONSTRAINT nx_cloud_usage_check 
  CHECK (nx_cloud_usage IN ('yes', 'no', 'considering', 'unknown'));

ALTER TABLE companies ADD COLUMN IF NOT EXISTS nx_cloud_why_not text;

-- Add adoption approach with constraint
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nx_adoption_approach text DEFAULT 'unknown';
ALTER TABLE companies ADD CONSTRAINT nx_adoption_approach_check 
  CHECK (nx_adoption_approach IN ('started_with_nx', 'added_to_existing', 'unknown'));

-- Add satisfaction scores with constraints
ALTER TABLE companies ADD COLUMN IF NOT EXISTS satisfaction_nx smallint DEFAULT 0;
ALTER TABLE companies ADD CONSTRAINT satisfaction_nx_check 
  CHECK (satisfaction_nx >= 0 AND satisfaction_nx <= 10);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS satisfaction_nx_cloud smallint DEFAULT 0;
ALTER TABLE companies ADD CONSTRAINT satisfaction_nx_cloud_check 
  CHECK (satisfaction_nx_cloud >= 0 AND satisfaction_nx_cloud <= 10);

-- Add advanced feature usage columns with constraints
ALTER TABLE companies ADD COLUMN IF NOT EXISTS agents_usage text DEFAULT 'unknown';
ALTER TABLE companies ADD CONSTRAINT agents_usage_check 
  CHECK (agents_usage IN ('yes', 'no', 'unknown'));

ALTER TABLE companies ADD COLUMN IF NOT EXISTS mfe_usage text DEFAULT 'unknown';
ALTER TABLE companies ADD CONSTRAINT mfe_usage_check 
  CHECK (mfe_usage IN ('yes', 'no', 'unknown'));

ALTER TABLE companies ADD COLUMN IF NOT EXISTS crystal_usage text DEFAULT 'unknown';
ALTER TABLE companies ADD CONSTRAINT crystal_usage_check 
  CHECK (crystal_usage IN ('yes', 'no', 'unknown'));

ALTER TABLE companies ADD COLUMN IF NOT EXISTS atomizer_usage text DEFAULT 'unknown';
ALTER TABLE companies ADD CONSTRAINT atomizer_usage_check 
  CHECK (atomizer_usage IN ('yes', 'no', 'unknown'));

-- Create function for global vector similarity matching
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION match_all_pain_points TO authenticated;
GRANT EXECUTE ON FUNCTION match_all_pain_points TO service_role;