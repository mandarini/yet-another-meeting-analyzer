/*
  # Add unique constraint for company names

  1. Changes
    - Add unique constraint on company names (case-insensitive)
    - Add function to normalize company names
    - Add trigger to normalize names before insert/update

  2. Security
    - Ensures data integrity at database level
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

-- Add unique constraint on normalized name
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