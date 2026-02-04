-- KASETA - Migrate Existing Organizations to New Permission System
-- Migration: 008_migrate_existing_orgs.sql
-- Run this AFTER 007_enterprise_permissions.sql

-- ============================================================================
-- STEP 1: Create default roles for all existing organizations
-- ============================================================================

DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    -- Check if roles already exist for this org
    IF NOT EXISTS (SELECT 1 FROM roles WHERE organization_id = org.id) THEN
      PERFORM create_default_roles_for_org(org.id);
      RAISE NOTICE 'Created default roles for organization %', org.id;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Migrate existing memberships to use role_id
-- ============================================================================

SELECT migrate_membership_roles();

-- ============================================================================
-- STEP 3: Set organization owners based on super_admin roles
-- ============================================================================

UPDATE organizations o
SET owner_id = (
  SELECT m.user_id
  FROM memberships m
  WHERE m.organization_id = o.id
    AND m.role = 'super_admin'
  ORDER BY m.joined_at ASC
  LIMIT 1
)
WHERE o.owner_id IS NULL;

-- If no super_admin, use the first admin
UPDATE organizations o
SET owner_id = (
  SELECT m.user_id
  FROM memberships m
  WHERE m.organization_id = o.id
    AND m.role = 'admin'
  ORDER BY m.joined_at ASC
  LIMIT 1
)
WHERE o.owner_id IS NULL;

-- If no admin, use the first member
UPDATE organizations o
SET owner_id = (
  SELECT m.user_id
  FROM memberships m
  WHERE m.organization_id = o.id
  ORDER BY m.joined_at ASC
  LIMIT 1
)
WHERE o.owner_id IS NULL;

-- ============================================================================
-- STEP 4: Verify migration
-- ============================================================================

DO $$
DECLARE
  orgs_without_roles INT;
  memberships_without_role_id INT;
  orgs_without_owner INT;
BEGIN
  SELECT COUNT(*) INTO orgs_without_roles
  FROM organizations o
  WHERE NOT EXISTS (SELECT 1 FROM roles WHERE organization_id = o.id);

  SELECT COUNT(*) INTO memberships_without_role_id
  FROM memberships WHERE role_id IS NULL;

  SELECT COUNT(*) INTO orgs_without_owner
  FROM organizations WHERE owner_id IS NULL;

  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Organizations without roles: %', orgs_without_roles;
  RAISE NOTICE 'Memberships without role_id: %', memberships_without_role_id;
  RAISE NOTICE 'Organizations without owner: %', orgs_without_owner;

  IF orgs_without_roles > 0 OR memberships_without_role_id > 0 THEN
    RAISE WARNING 'Migration incomplete! Please check the data.';
  ELSE
    RAISE NOTICE 'Migration completed successfully!';
  END IF;
END $$;
