/*
  # Fix user info view and function

  1. Changes
    - Update user_info view to correctly reference last_sign_in_at
    - Fix type casting for role column
    - Ensure proper schema references
*/

-- Drop existing objects
DO $$ 
BEGIN
  DROP VIEW IF EXISTS public.user_info;
  DROP FUNCTION IF EXISTS public.get_all_users();
END $$;

-- Recreate view with correct field references
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
  au.id,
  au.email::text as email,
  au.created_at,
  au.last_sign_in_at,
  ur.role_id as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id;

-- Recreate function with proper type handling
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  role user_role,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    COALESCE(ui.role, 'user'::user_role) as role,
    ui.created_at,
    ui.last_sign_in_at
  FROM public.user_info ui;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.user_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;