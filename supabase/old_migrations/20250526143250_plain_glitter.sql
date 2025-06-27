/*
  # Fix super admin role assignment

  1. Changes
    - Use distinct variable names to avoid column ambiguity
    - Assign super_admin role to katerina@nrwl.io
    - Add audit log entry for role assignment
*/

DO $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  -- Get user ID for katerina@nrwl.io
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'katerina@nrwl.io';

  -- Assign super_admin role
  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_admin_user_id, 'super_admin')
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Log the action
  INSERT INTO audit_logs (user_id, action, details)
  VALUES (
    v_admin_user_id,
    'role_assigned',
    jsonb_build_object(
      'role', 'super_admin',
      'assigned_by', 'system',
      'reason', 'Initial super admin setup'
    )
  );
END $$;