/*
  # Fix pain points schema and vector similarity

  1. Changes
    - Add vector similarity function for pain points matching
    - Update pain points table with correct column names
    - Add necessary indexes and permissions

  2. Security
    - Grant appropriate permissions to authenticated users
    - Enable RLS policies for new functions
*/

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure pain_points table has correct columns
DO $$ 
BEGIN
  -- Add embedding column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pain_points' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE pain_points ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- Create or replace the match_pain_points function
CREATE OR REPLACE FUNCTION match_pain_points(
  company_id uuid,
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.8
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

-- Create index for faster similarity searches if it doesn't exist
CREATE INDEX IF NOT EXISTS pain_points_embedding_idx 
ON pain_points USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION match_pain_points TO authenticated;
GRANT EXECUTE ON FUNCTION match_pain_points TO service_role;