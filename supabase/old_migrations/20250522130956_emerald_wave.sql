/*
  # Fix pain points schema and add vector similarity function

  1. Changes
    - Add vector similarity function for pain point matching
    - Add embedding column to pain_points table
    - Fix column name from severity to urgency_score in queries

  2. New Functions
    - match_pain_points: Finds similar pain points using vector similarity
*/

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to pain_points table
ALTER TABLE pain_points ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create function to match pain points using vector similarity
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

-- Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS pain_points_embedding_idx ON pain_points 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Grant access to the function
GRANT EXECUTE ON FUNCTION match_pain_points TO authenticated;
GRANT EXECUTE ON FUNCTION match_pain_points TO service_role;