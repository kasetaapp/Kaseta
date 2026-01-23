-- ============================================
-- KASETA - Invitations & Access Control Migration
-- ============================================

-- ============================================
-- INVITATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_email TEXT,
  type TEXT DEFAULT 'single', -- single, recurring, temporary, permanent
  status TEXT DEFAULT 'pending', -- pending, active, used, expired, cancelled
  short_code TEXT UNIQUE NOT NULL,
  qr_data TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  notes TEXT,
  vehicle_plate TEXT,
  vehicle_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_unit ON invitations(unit_id);
CREATE INDEX idx_invitations_code ON invitations(short_code);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_valid_until ON invitations(valid_until);

-- ============================================
-- FREQUENT VISITORS
-- ============================================
CREATE TABLE IF NOT EXISTS frequent_visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  relationship TEXT, -- family, friend, service, delivery, other
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frequent_visitors_user ON frequent_visitors(user_id);
CREATE INDEX idx_frequent_visitors_unit ON frequent_visitors(unit_id);

-- ============================================
-- ACCESS LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  visitor_name TEXT,
  visitor_phone TEXT,
  vehicle_plate TEXT,
  access_type TEXT NOT NULL, -- invitation, manual, vehicle, resident
  entry_method TEXT, -- qr, code, manual, plate_scan
  direction TEXT DEFAULT 'entry', -- entry, exit
  granted_by UUID REFERENCES users(id),
  notes TEXT,
  photo_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_org ON access_logs(organization_id);
CREATE INDEX idx_access_logs_unit ON access_logs(unit_id);
CREATE INDEX idx_access_logs_invitation ON access_logs(invitation_id);
CREATE INDEX idx_access_logs_created ON access_logs(created_at DESC);
CREATE INDEX idx_access_logs_type ON access_logs(access_type);

-- ============================================
-- RLS POLICIES - INVITATIONS
-- ============================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invitations"
  ON invitations FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can view unit invitations"
  ON invitations FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Guards can view org invitations"
  ON invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'guard') AND status = 'active'
    )
  );

CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update their invitations"
  ON invitations FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their invitations"
  ON invitations FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- RLS POLICIES - FREQUENT VISITORS
-- ============================================
ALTER TABLE frequent_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their frequent visitors"
  ON frequent_visitors FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - ACCESS LOGS
-- ============================================
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unit access logs"
  ON access_logs FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Guards can view and create org access logs"
  ON access_logs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'guard') AND status = 'active'
    )
  );

-- ============================================
-- FUNCTION: Generate Short Code
-- ============================================
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-generate Short Code
-- ============================================
CREATE OR REPLACE FUNCTION set_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_code IS NULL THEN
    LOOP
      NEW.short_code := generate_short_code();
      BEGIN
        RETURN NEW;
      EXCEPTION WHEN unique_violation THEN
        -- Try again with a new code
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitations_set_code
  BEFORE INSERT ON invitations
  FOR EACH ROW EXECUTE FUNCTION set_invitation_code();

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER frequent_visitors_updated_at
  BEFORE UPDATE ON frequent_visitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
