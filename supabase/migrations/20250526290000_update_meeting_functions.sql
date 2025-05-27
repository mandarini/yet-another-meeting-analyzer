/*
  # Update Meeting Functions

  1. Changes
    - Update meeting-related functions to use new role system
    - Remove role-based restrictions from functions
    - Keep super admin privileges for management
    - Update vector similarity functions
*/

-- Update match_pain_points function
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

-- Update match_all_pain_points function
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

-- Create function to get meetings with company info
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

-- Create function to get meeting details
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