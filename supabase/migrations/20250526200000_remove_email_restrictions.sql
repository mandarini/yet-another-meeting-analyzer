/*
  # Remove Email Domain Restrictions

  1. Changes
    - Remove email domain restriction trigger
    - Remove email domain check function
    - Keep role-based access control intact
*/

-- Drop the email domain check trigger
DROP TRIGGER IF EXISTS check_email_domain_trigger ON auth.users;

-- Drop the email domain check function
DROP FUNCTION IF EXISTS check_email_domain();

-- Keep the default role assignment trigger and function
-- This ensures new users still get the 'sales' role by default 