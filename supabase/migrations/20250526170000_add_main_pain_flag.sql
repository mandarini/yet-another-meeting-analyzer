/*
  # Add Main Pain Point Flag

  1. Changes
    - Add is_main_pain boolean column to pain_points table
    - Set default value to false
    - Create index for faster queries on main pain points

  2. Security
    - Existing RLS policies will be maintained
*/

-- Add is_main_pain column
ALTER TABLE pain_points 
ADD COLUMN IF NOT EXISTS is_main_pain boolean NOT NULL DEFAULT false;

-- Create index for faster queries on main pain points
CREATE INDEX IF NOT EXISTS idx_pain_points_is_main_pain 
ON pain_points (is_main_pain) 
WHERE is_main_pain = true; 