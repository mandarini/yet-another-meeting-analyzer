/*
  # Add super admin role

  1. Changes
    - Assign super_admin role to katerina@nrwl.io
    - Add audit log entry for role assignment
*/

DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get user ID for katerina@nrwl.io
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'katerina@nrwl.io';

  -- Assign super_admin role
  INSERT INTO user_roles (user_id, role_id)
  VALUES (user_id, 'super_admin')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Log the action
  INSERT INTO audit_logs (user_id, action, details)
  VALUES (
    user_id,
    'role_assigned',
    jsonb_build_object(
      'role', 'super_admin',
      'assigned_by', 'system',
      'reason', 'Initial super admin setup'
    )
  );
END $$;