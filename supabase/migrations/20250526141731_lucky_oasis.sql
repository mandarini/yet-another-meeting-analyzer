/*
  # Authentication and Authorization System

  1. New Tables
    - `roles`
      - Predefined user roles with hierarchical privileges
    - `user_roles`
      - Junction table linking users to roles
    - `audit_logs`
      - Track administrative actions and role changes

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Add domain restriction function
*/

-- Create roles enum
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'sales', 'user');

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id user_role PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert predefined roles
INSERT INTO roles (id, description) VALUES
  ('super_admin', 'Highest privilege level with full system access'),
  ('admin', 'Administrative access with user management capabilities'),
  ('sales', 'Sales team member with customer data access'),
  ('user', 'Standard user access')
ON CONFLICT (id) DO NOTHING;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id user_role REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Roles are viewable by authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "User roles are viewable by admins"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "User roles are modifiable by admins"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Audit logs are viewable by admins"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('super_admin', 'admin')
    )
  );

-- Create function to check email domain
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS trigger AS $$
BEGIN
  IF NEW.email NOT LIKE '%@nrwl.io' THEN
    RAISE EXCEPTION 'Only @nrwl.io email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check email domain before insert
CREATE TRIGGER check_email_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION check_email_domain();

-- Create function to assign default role
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'sales');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to assign default role after insert
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role();