-- KASETA Demo Data
-- Run this after 001_initial_schema.sql to set up test data

-- Create demo organization
INSERT INTO organizations (id, name, type, slug, settings)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Torre Reforma 123',
  'residential',
  'TORRE123',
  '{"address": "Paseo de la Reforma 123, CDMX", "features": ["pool", "gym", "parking"]}'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- Create demo units
INSERT INTO units (id, organization_id, name, identifier)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Departamento 101', '101'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Departamento 102', '102'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Departamento 201', '201'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Departamento 202', '202'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Departamento 301', '301')
ON CONFLICT (id) DO NOTHING;

-- Note: Memberships need to reference real user IDs
-- Run this after users register:
--
-- INSERT INTO memberships (user_id, organization_id, unit_id, role, is_active)
-- SELECT
--   p.id as user_id,
--   'a0000000-0000-0000-0000-000000000001' as organization_id,
--   'b0000000-0000-0000-0000-000000000001' as unit_id,
--   'resident' as role,
--   true as is_active
-- FROM profiles p
-- WHERE p.email = 'contact@kaseta.app'
-- ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Add RLS policy for inserting memberships (for join flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can join organizations'
  ) THEN
    CREATE POLICY "Users can join organizations" ON memberships
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

-- Add policy for viewing organizations by slug (for join flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view org by slug'
  ) THEN
    CREATE POLICY "Anyone can view org by slug" ON organizations
      FOR SELECT USING (slug IS NOT NULL);
  END IF;
END
$$;
