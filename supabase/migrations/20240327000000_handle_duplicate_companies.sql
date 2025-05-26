/*
  # Handle Duplicate Companies

  1. Changes
    - Add normalized_name column for case-insensitive company name comparison
    - Add unique constraint on normalized_name
    - Add function to normalize company names
    - Add trigger to normalize names before insert/update
    - Merge any existing duplicate companies

  2. Security
    - Ensures data integrity at database level
    - Prevents duplicate companies with different casing
*/

-- Create function to normalize company names
CREATE OR REPLACE FUNCTION normalize_company_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(regexp_replace(lower($1), '\s+', ' ', 'g'));
$$;

-- Add normalized_name column
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS normalized_name text GENERATED ALWAYS AS (normalize_company_name(name)) STORED;

-- Function to merge duplicate companies
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
  -- Find all duplicate companies
  FOR duplicate IN 
    SELECT normalized_name, array_agg(id ORDER BY created_at) as ids
    FROM companies
    GROUP BY normalized_name
    HAVING count(*) > 1
  LOOP
    -- Keep the oldest company as the target
    target_id := duplicate.ids[1];
    
    -- Get target company's technologies
    SELECT technologies_used INTO target_technologies
    FROM companies
    WHERE id = target_id;
    
    -- For each duplicate company, merge its data into the target
    FOR i IN 2..array_length(duplicate.ids, 1) LOOP
      source_id := duplicate.ids[i];
      
      -- Get the source company data
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
      FROM companies
      WHERE id = source_id;
      
      -- Combine technologies arrays
      IF merged_technologies IS NOT NULL THEN
        target_technologies := array(
          SELECT DISTINCT unnest(target_technologies || merged_technologies)
        );
      END IF;
      
      -- Update target company with merged data
      UPDATE companies
      SET
        technologies_used = target_technologies,
        nx_version = COALESCE(
          (SELECT nx_version FROM companies WHERE id = target_id),
          merged_nx_version
        ),
        years_using_nx = GREATEST(
          COALESCE((SELECT years_using_nx FROM companies WHERE id = target_id), '0'),
          COALESCE(merged_years_using_nx, '0')
        ),
        workspace_size = COALESCE(
          (SELECT workspace_size FROM companies WHERE id = target_id),
          merged_workspace_size
        ),
        ci_provider = COALESCE(
          (SELECT ci_provider FROM companies WHERE id = target_id),
          merged_ci_provider
        ),
        nx_cloud_usage = COALESCE(
          (SELECT nx_cloud_usage FROM companies WHERE id = target_id),
          merged_nx_cloud_usage
        ),
        nx_adoption_approach = COALESCE(
          (SELECT nx_adoption_approach FROM companies WHERE id = target_id),
          merged_nx_adoption_approach
        ),
        satisfaction_nx = (
          COALESCE((SELECT satisfaction_nx FROM companies WHERE id = target_id), 0) +
          COALESCE(merged_satisfaction_nx, 0)
        ) / 2,
        satisfaction_nx_cloud = (
          COALESCE((SELECT satisfaction_nx_cloud FROM companies WHERE id = target_id), 0) +
          COALESCE(merged_satisfaction_nx_cloud, 0)
        ) / 2,
        agents_usage = COALESCE(
          (SELECT agents_usage FROM companies WHERE id = target_id),
          merged_agents_usage
        ),
        mfe_usage = COALESCE(
          (SELECT mfe_usage FROM companies WHERE id = target_id),
          merged_mfe_usage
        ),
        crystal_usage = COALESCE(
          (SELECT crystal_usage FROM companies WHERE id = target_id),
          merged_crystal_usage
        ),
        atomizer_usage = COALESCE(
          (SELECT atomizer_usage FROM companies WHERE id = target_id),
          merged_atomizer_usage
        )
      WHERE id = target_id;
      
      -- Update all meetings to point to the target company
      UPDATE meetings
      SET company_id = target_id
      WHERE company_id = source_id;
      
      -- Delete the source company
      DELETE FROM companies
      WHERE id = source_id;
    END LOOP;
  END LOOP;
END;
$$;

-- Run the merge function to handle any existing duplicates
SELECT merge_duplicate_companies();

-- Now we can safely add the unique constraint
ALTER TABLE companies 
ADD CONSTRAINT companies_normalized_name_key UNIQUE (normalized_name);

-- Create trigger function to handle updates
CREATE OR REPLACE FUNCTION update_company_normalized_name()
RETURNS trigger AS $$
BEGIN
  NEW.normalized_name := normalize_company_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_company_normalized_name_trigger
  BEFORE INSERT OR UPDATE OF name ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_company_normalized_name(); 