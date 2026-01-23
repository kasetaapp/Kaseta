-- KASETA Improved RLS Policies
-- Run this after 002_demo_data.sql

-- Allow authenticated users to view organizations by slug (for join flow)
DROP POLICY IF EXISTS "Anyone can view org by slug" ON organizations;
CREATE POLICY "Authenticated users can view orgs by slug" ON organizations
  FOR SELECT
  TO authenticated
  USING (slug IS NOT NULL);

-- Allow users to join organizations (insert membership)
DROP POLICY IF EXISTS "Users can join organizations" ON memberships;
CREATE POLICY "Users can join organizations" ON memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Improved invitation policies
-- Users can view invitations they created (already exists, but ensure it's there)
DROP POLICY IF EXISTS "Users can view invitations they created" ON invitations;
CREATE POLICY "Users can view invitations they created" ON invitations
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can create invitations if they have a unit OR for their organization
DROP POLICY IF EXISTS "Users can create invitations for their unit" ON invitations;
CREATE POLICY "Users can create invitations" ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be a member of the organization
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND
    -- If unit_id is provided, it must match user's unit
    (
      unit_id IS NULL
      OR
      unit_id IN (
        SELECT unit_id FROM memberships
        WHERE user_id = auth.uid() AND is_active = true AND unit_id IS NOT NULL
      )
    )
  );

-- Allow authenticated users to view all units in organizations they're joining
-- This is needed for the join flow to show available units
DROP POLICY IF EXISTS "Users can view units in their organization" ON units;
CREATE POLICY "Users can view org units" ON units
  FOR SELECT
  TO authenticated
  USING (
    -- Either user is already a member
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR
    -- Or the organization has a public slug (for join flow)
    organization_id IN (
      SELECT id FROM organizations WHERE slug IS NOT NULL
    )
  );

-- Allow guards to validate any invitation by QR/short code
DROP POLICY IF EXISTS "Guards can validate invitations" ON invitations;
CREATE POLICY "Guards can validate invitations" ON invitations
  FOR SELECT
  TO authenticated
  USING (
    -- Guards and admins can see all invitations in their org
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid()
      AND role IN ('guard', 'admin', 'super_admin')
      AND is_active = true
    )
  );
