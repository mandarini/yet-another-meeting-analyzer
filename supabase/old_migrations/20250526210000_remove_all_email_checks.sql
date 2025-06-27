/*
  # Remove All Email Domain Checks

  1. Changes
    - Remove all email domain check triggers
    - Remove all email domain check functions
    - Ensure no email domain restrictions remain
*/

-- Drop all email domain check triggers
DROP TRIGGER IF EXISTS check_email_domain_trigger ON auth.users;

-- Drop all email domain check functions
DROP FUNCTION IF EXISTS check_email_domain();

-- Verify no email domain check functions exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'check_email_domain'
  ) THEN
    RAISE EXCEPTION 'Email domain check function still exists';
  END IF;
END $$; 