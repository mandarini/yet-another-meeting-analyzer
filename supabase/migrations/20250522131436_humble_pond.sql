/*
  # Fix pain points schema and vector similarity search

  1. Changes
    - Enable vector extension
    - Add embedding column to pain_points table
    - Create vector similarity search function
    - Add vector similarity index
    - Set up proper permissions

  2. Security
    - Function runs with SECURITY DEFINER
    - Limited to authenticated users
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

-- Drop existing function if it exists (all variations)
DROP FUNCTION IF EXISTS match_pain_points(uuid, vector, float);
DROP FUNCTION IF EXISTS match_pain_points(uuid, vector);
DROP FUNCTION IF EXISTS match_pain_points(company_id uuid, query_embedding vector, similarity_threshold float);

-- Create the match_pain_points function with fully qualified parameter names
CREATE FUNCTION public.match_pain_points(
  _company_id uuid,
  _query_embedding vector(1536),
  _similarity_threshold float DEFAULT 0.8
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
    1 - (p.embedding <=> _query_embedding) as similarity
  FROM pain_points p
  JOIN meetings m ON p.meeting_id = m.id
  WHERE 
    m.company_id = _company_id
    AND 1 - (p.embedding <=> _query_embedding) > _similarity_threshold
  ORDER BY similarity DESC;
END;
$$;

-- Drop existing index if it exists
DROP INDEX IF EXISTS pain_points_embedding_idx;

-- Create index for faster similarity searches
CREATE INDEX pain_points_embedding_idx 
ON pain_points USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.match_pain_points(_company_id uuid, _query_embedding vector, _similarity_threshold float) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_pain_points(_company_id uuid, _query_embedding vector, _similarity_threshold float) TO service_role;