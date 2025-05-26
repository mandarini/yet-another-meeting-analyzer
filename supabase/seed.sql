-- Seed data for companies
INSERT INTO companies (name, technologies_used, nx_version, years_using_nx, workspace_size, ci_provider, nx_cloud_usage, nx_adoption_approach, satisfaction_nx, satisfaction_nx_cloud, agents_usage, mfe_usage, crystal_usage, atomizer_usage)
VALUES
  ('Acme Corp', ARRAY['Angular', 'React', 'Node.js'], '17.0.0', '3', 'large', 'GitHub Actions', 'yes', 'started_with_nx', 9, 8, 'yes', 'yes', 'no', 'yes'),
  ('TechStart Inc', ARRAY['React', 'TypeScript'], '16.10.0', '2', 'medium', 'CircleCI', 'considering', 'added_to_existing', 8, 7, 'no', 'yes', 'no', 'no'),
  ('Global Solutions', ARRAY['Angular', 'NestJS'], '17.1.0', '4', 'large', 'Jenkins', 'yes', 'started_with_nx', 10, 9, 'yes', 'yes', 'yes', 'yes'),
  ('Innovate Labs', ARRAY['Vue', 'Node.js'], '16.9.0', '1', 'small', 'GitLab CI', 'no', 'added_to_existing', 7, 6, 'no', 'no', 'no', 'no'),
  ('Future Systems', ARRAY['React', 'Next.js'], '17.0.0', '2', 'medium', 'GitHub Actions', 'yes', 'started_with_nx', 9, 8, 'yes', 'yes', 'no', 'yes');

-- Seed data for meetings
INSERT INTO meetings (company_id, date, title, summary)
VALUES
  ((SELECT id FROM companies WHERE name = 'Acme Corp'), '2024-03-15 10:00:00', 'Q1 Review', 'Discussion about Nx adoption and performance improvements'),
  ((SELECT id FROM companies WHERE name = 'TechStart Inc'), '2024-03-14 14:00:00', 'Architecture Planning', 'Planning migration to Nx and setting up CI/CD'),
  ((SELECT id FROM companies WHERE name = 'Global Solutions'), '2024-03-13 11:00:00', 'Performance Optimization', 'Review of build times and optimization strategies'),
  ((SELECT id FROM companies WHERE name = 'Innovate Labs'), '2024-03-12 15:00:00', 'Nx Introduction', 'Initial discussion about Nx features and benefits'),
  ((SELECT id FROM companies WHERE name = 'Future Systems'), '2024-03-11 09:00:00', 'Team Training', 'Training session on Nx best practices');

-- Seed data for pain points
INSERT INTO pain_points (meeting_id, description, embedding)
VALUES
  ((SELECT id FROM meetings WHERE title = 'Q1 Review'), 'Build times are too slow with large monorepo', '[0.1, 0.2, 0.3]'::vector),
  ((SELECT id FROM meetings WHERE title = 'Architecture Planning'), 'Difficulty managing dependencies between projects', '[0.2, 0.3, 0.4]'::vector),
  ((SELECT id FROM meetings WHERE title = 'Performance Optimization'), 'Cache invalidation issues in CI/CD pipeline', '[0.3, 0.4, 0.5]'::vector),
  ((SELECT id FROM meetings WHERE title = 'Nx Introduction'), 'Learning curve for team members', '[0.4, 0.5, 0.6]'::vector),
  ((SELECT id FROM meetings WHERE title = 'Team Training'), 'Need better documentation for custom plugins', '[0.5, 0.6, 0.7]'::vector);

-- Note: The embedding vectors above are simplified examples. In a real scenario, 
-- you would use actual embeddings generated from the descriptions using an embedding model. 

-- Cleanup section (uncomment to remove seed data)
/*
DELETE FROM pain_points WHERE meeting_id IN (
  SELECT id FROM meetings WHERE company_id IN (
    SELECT id FROM companies WHERE name IN (
      'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovate Labs', 'Future Systems'
    )
  )
);

DELETE FROM meetings WHERE company_id IN (
  SELECT id FROM companies WHERE name IN (
    'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovate Labs', 'Future Systems'
  )
);

DELETE FROM companies WHERE name IN (
  'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovate Labs', 'Future Systems'
);
*/ 