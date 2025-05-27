/*
  # Modify Email Domain Check

  1. Changes
    - Modify the email domain check function to allow all domains
    - Keep the trigger structure but make it permissive
*/

-- Modify the email domain check function to allow all domains
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS trigger AS $$
BEGIN
  -- Allow all email domains
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 