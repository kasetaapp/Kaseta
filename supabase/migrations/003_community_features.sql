-- ============================================
-- KASETA - Community Features Migration
-- Announcements, Maintenance, Amenities, Packages
-- ============================================

-- ============================================
-- ANNOUNCEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general', -- general, info, warning, urgent
  is_pinned BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_org ON announcements(organization_id);
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_published ON announcements(published_at DESC);
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned);

-- ============================================
-- MAINTENANCE REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- plumbing, electrical, hvac, structural, appliances, common_areas, other
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  resolution_notes TEXT,
  photos JSONB DEFAULT '[]',
  scheduled_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_org ON maintenance_requests(organization_id);
CREATE INDEX idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_created ON maintenance_requests(created_at DESC);

-- ============================================
-- AMENITIES
-- ============================================
CREATE TABLE IF NOT EXISTS amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  capacity INTEGER,
  requires_reservation BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  rules TEXT,
  operating_hours JSONB, -- { "mon": { "open": "08:00", "close": "22:00" }, ... }
  advance_booking_days INTEGER DEFAULT 7,
  max_duration_hours INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_amenities_org ON amenities(organization_id);
CREATE INDEX idx_amenities_available ON amenities(available);

-- ============================================
-- AMENITY RESERVATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS amenity_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  reserved_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed', -- pending, confirmed, cancelled, completed
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_amenity ON amenity_reservations(amenity_id);
CREATE INDEX idx_reservations_unit ON amenity_reservations(unit_id);
CREATE INDEX idx_reservations_user ON amenity_reservations(reserved_by);
CREATE INDEX idx_reservations_time ON amenity_reservations(start_time);
CREATE INDEX idx_reservations_status ON amenity_reservations(status);

-- ============================================
-- PACKAGES
-- ============================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT,
  description TEXT,
  status TEXT DEFAULT 'received', -- pending, received, picked_up, returned
  received_at TIMESTAMPTZ DEFAULT NOW(),
  received_by UUID REFERENCES users(id),
  picked_up_at TIMESTAMPTZ,
  picked_up_by UUID REFERENCES users(id),
  photo_url TEXT,
  signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packages_org ON packages(organization_id);
CREATE INDEX idx_packages_unit ON packages(unit_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_tracking ON packages(tracking_number);
CREATE INDEX idx_packages_received ON packages(received_at DESC);

-- ============================================
-- COMMUNITY CONTACTS (Emergency)
-- ============================================
CREATE TABLE IF NOT EXISTS community_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL, -- admin, security, maintenance, emergency, other
  is_emergency BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_contacts_org ON community_contacts(organization_id);
CREATE INDEX idx_community_contacts_emergency ON community_contacts(is_emergency);

-- ============================================
-- RLS POLICIES - ANNOUNCEMENTS
-- ============================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org announcements"
  ON announcements FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES - MAINTENANCE REQUESTS
-- ============================================
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unit maintenance requests"
  ON maintenance_requests FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create maintenance requests"
  ON maintenance_requests FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update their own requests"
  ON maintenance_requests FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all maintenance requests"
  ON maintenance_requests FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES - AMENITIES
-- ============================================
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org amenities"
  ON amenities FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage amenities"
  ON amenities FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES - AMENITY RESERVATIONS
-- ============================================
ALTER TABLE amenity_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view amenity reservations"
  ON amenity_reservations FOR SELECT
  USING (
    amenity_id IN (
      SELECT id FROM amenities WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can create reservations"
  ON amenity_reservations FOR INSERT
  WITH CHECK (
    reserved_by = auth.uid() AND
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update their reservations"
  ON amenity_reservations FOR UPDATE
  USING (reserved_by = auth.uid());

CREATE POLICY "Users can delete their reservations"
  ON amenity_reservations FOR DELETE
  USING (reserved_by = auth.uid());

-- ============================================
-- RLS POLICIES - PACKAGES
-- ============================================
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unit packages"
  ON packages FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update their packages"
  ON packages FOR UPDATE
  USING (
    unit_id IN (
      SELECT unit_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Guards can manage org packages"
  ON packages FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'guard') AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES - COMMUNITY CONTACTS
-- ============================================
ALTER TABLE community_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org contacts"
  ON community_contacts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage contacts"
  ON community_contacts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER amenities_updated_at
  BEFORE UPDATE ON amenities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER amenity_reservations_updated_at
  BEFORE UPDATE ON amenity_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER community_contacts_updated_at
  BEFORE UPDATE ON community_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
