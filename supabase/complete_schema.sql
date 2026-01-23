-- ============================================
-- KASETA - Complete Database Schema
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- CLEANUP: Drop all existing tables (in correct order)
-- ============================================
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS lost_found_items CASCADE;
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS push_tokens CASCADE;
DROP TABLE IF EXISTS community_contacts CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS amenity_reservations CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS frequent_visitors CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'MX',
  timezone TEXT DEFAULT 'America/Mexico_City',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================
-- 2. USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  show_in_directory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================
-- 3. UNITS (Apartments, Houses, Offices)
-- ============================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  building TEXT,
  floor INTEGER,
  type TEXT DEFAULT 'apartment',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_units_organization ON units(organization_id);
CREATE INDEX idx_units_number ON units(unit_number);
CREATE UNIQUE INDEX idx_units_unique ON units(organization_id, unit_number, COALESCE(building, ''));

-- ============================================
-- 4. ORGANIZATION MEMBERS
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'resident',
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_unit ON organization_members(unit_id);
CREATE INDEX idx_org_members_role ON organization_members(role);

-- ============================================
-- 5. VEHICLES
-- ============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  year INTEGER,
  type TEXT DEFAULT 'car',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_org ON vehicles(organization_id);

-- ============================================
-- 6. INVITATIONS
-- ============================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_email TEXT,
  type TEXT DEFAULT 'single',
  status TEXT DEFAULT 'pending',
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
-- 7. FREQUENT VISITORS
-- ============================================
CREATE TABLE frequent_visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  relationship TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frequent_visitors_user ON frequent_visitors(user_id);
CREATE INDEX idx_frequent_visitors_unit ON frequent_visitors(unit_id);

-- ============================================
-- 8. ACCESS LOGS
-- ============================================
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  visitor_name TEXT,
  visitor_phone TEXT,
  vehicle_plate TEXT,
  access_type TEXT NOT NULL,
  entry_method TEXT,
  direction TEXT DEFAULT 'entry',
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
-- 9. ANNOUNCEMENTS
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general',
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
-- 10. MAINTENANCE REQUESTS
-- ============================================
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
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
-- 11. AMENITIES
-- ============================================
CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  capacity INTEGER,
  requires_reservation BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  rules TEXT,
  operating_hours JSONB,
  advance_booking_days INTEGER DEFAULT 7,
  max_duration_hours INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_amenities_org ON amenities(organization_id);
CREATE INDEX idx_amenities_available ON amenities(available);

-- ============================================
-- 12. AMENITY RESERVATIONS
-- ============================================
CREATE TABLE amenity_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  reserved_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed',
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
-- 13. PACKAGES
-- ============================================
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT,
  description TEXT,
  status TEXT DEFAULT 'received',
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
-- 14. COMMUNITY CONTACTS
-- ============================================
CREATE TABLE community_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  is_emergency BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_contacts_org ON community_contacts(organization_id);
CREATE INDEX idx_community_contacts_emergency ON community_contacts(is_emergency);

-- ============================================
-- 15. PUSH TOKENS
-- ============================================
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);

-- ============================================
-- 16. NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  visitor_arrivals BOOLEAN DEFAULT true,
  package_arrivals BOOLEAN DEFAULT true,
  announcements BOOLEAN DEFAULT true,
  maintenance_updates BOOLEAN DEFAULT true,
  reservation_reminders BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- ============================================
-- 17. NOTIFICATION LOGS
-- ============================================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  errors JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at DESC);

-- ============================================
-- 18. IN-APP NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 19. PETS
-- ============================================
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dog', 'cat', 'other')),
  breed TEXT,
  notes TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pets_user ON pets(user_id);
CREATE INDEX idx_pets_unit ON pets(unit_id);
CREATE INDEX idx_pets_org ON pets(organization_id);

-- ============================================
-- 20. POLLS
-- ============================================
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_polls_org ON polls(organization_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_ends ON polls(ends_at);

-- ============================================
-- 21. POLL OPTIONS
-- ============================================
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);

-- ============================================
-- 22. POLL VOTES
-- ============================================
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

-- ============================================
-- 23. LOST AND FOUND ITEMS
-- ============================================
CREATE TABLE lost_found_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed')),
  photo_url TEXT,
  claimed_by UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lost_found_org ON lost_found_items(organization_id);
CREATE INDEX idx_lost_found_type ON lost_found_items(type);
CREATE INDEX idx_lost_found_status ON lost_found_items(status);
CREATE INDEX idx_lost_found_created ON lost_found_items(created_at DESC);

-- ============================================
-- 24. DOCUMENTS
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('regulations', 'contracts', 'forms', 'notices')),
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  file_size INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate Short Code for invitations
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

-- Function: Set invitation code automatically
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

-- Function: Create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment poll vote count
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Close expired polls
CREATE OR REPLACE FUNCTION close_expired_polls()
RETURNS void AS $$
BEGIN
  UPDATE polls
  SET status = 'closed', updated_at = NOW()
  WHERE status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Expire invitations
CREATE OR REPLACE FUNCTION expire_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND valid_until IS NOT NULL
    AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Mark invitation as used
CREATE OR REPLACE FUNCTION mark_invitation_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_id IS NOT NULL THEN
    UPDATE invitations
    SET
      used_count = used_count + 1,
      status = CASE
        WHEN type = 'single' THEN 'used'
        WHEN used_count + 1 >= max_uses AND max_uses IS NOT NULL THEN 'used'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.invitation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Complete past reservations
CREATE OR REPLACE FUNCTION complete_past_reservations()
RETURNS void AS $$
BEGIN
  UPDATE amenity_reservations
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'confirmed'
    AND end_time < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER organization_members_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invitations_set_code BEFORE INSERT ON invitations FOR EACH ROW EXECUTE FUNCTION set_invitation_code();
CREATE TRIGGER frequent_visitors_updated_at BEFORE UPDATE ON frequent_visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER amenities_updated_at BEFORE UPDATE ON amenities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER amenity_reservations_updated_at BEFORE UPDATE ON amenity_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER community_contacts_updated_at BEFORE UPDATE ON community_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER push_tokens_updated_at BEFORE UPDATE ON push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_create_notification_preferences AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();
CREATE TRIGGER access_logs_mark_invitation_used AFTER INSERT ON access_logs FOR EACH ROW EXECUTE FUNCTION mark_invitation_used();
CREATE TRIGGER pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER polls_updated_at BEFORE UPDATE ON polls FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER poll_votes_increment AFTER INSERT ON poll_votes FOR EACH ROW EXECUTE FUNCTION increment_vote_count();
CREATE TRIGGER lost_found_items_updated_at BEFORE UPDATE ON lost_found_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ORGANIZATIONS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select" ON organizations FOR SELECT USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_self" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_select_org" ON users FOR SELECT USING (id IN (SELECT om.user_id FROM organization_members om WHERE om.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')));
CREATE POLICY "users_update_self" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert_self" ON users FOR INSERT WITH CHECK (id = auth.uid());

-- UNITS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units_select" ON units FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "units_manage" ON units FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- ORGANIZATION MEMBERS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_self" ON organization_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "members_select_org" ON organization_members FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "members_manage" ON organization_members FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- VEHICLES
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_select_self" ON vehicles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "vehicles_manage_self" ON vehicles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "vehicles_select_guard" ON vehicles FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'guard') AND status = 'active'));

-- INVITATIONS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_select_creator" ON invitations FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "inv_select_unit" ON invitations FOR SELECT USING (unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "inv_select_guard" ON invitations FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'guard') AND status = 'active'));
CREATE POLICY "inv_insert" ON invitations FOR INSERT WITH CHECK (created_by = auth.uid() AND unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "inv_update" ON invitations FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "inv_delete" ON invitations FOR DELETE USING (created_by = auth.uid());

-- FREQUENT VISITORS
ALTER TABLE frequent_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fv_manage" ON frequent_visitors FOR ALL USING (user_id = auth.uid());

-- ACCESS LOGS
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "al_select_unit" ON access_logs FOR SELECT USING (unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "al_manage_guard" ON access_logs FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'guard') AND status = 'active'));

-- ANNOUNCEMENTS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_select" ON announcements FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "ann_manage" ON announcements FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- MAINTENANCE REQUESTS
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maint_select_unit" ON maintenance_requests FOR SELECT USING (unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "maint_insert" ON maintenance_requests FOR INSERT WITH CHECK (created_by = auth.uid() AND unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "maint_update_creator" ON maintenance_requests FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "maint_manage_admin" ON maintenance_requests FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- AMENITIES
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amen_select" ON amenities FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "amen_manage" ON amenities FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- AMENITY RESERVATIONS
ALTER TABLE amenity_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "res_select" ON amenity_reservations FOR SELECT USING (amenity_id IN (SELECT id FROM amenities WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')));
CREATE POLICY "res_insert" ON amenity_reservations FOR INSERT WITH CHECK (reserved_by = auth.uid() AND unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "res_update" ON amenity_reservations FOR UPDATE USING (reserved_by = auth.uid());
CREATE POLICY "res_delete" ON amenity_reservations FOR DELETE USING (reserved_by = auth.uid());

-- PACKAGES
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pkg_select_unit" ON packages FOR SELECT USING (unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "pkg_update_unit" ON packages FOR UPDATE USING (unit_id IN (SELECT unit_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "pkg_manage_guard" ON packages FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'guard') AND status = 'active'));

-- COMMUNITY CONTACTS
ALTER TABLE community_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select" ON community_contacts FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "contacts_manage" ON community_contacts FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- PUSH TOKENS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tokens_manage" ON push_tokens FOR ALL USING (user_id = auth.uid());

-- NOTIFICATION PREFERENCES
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_manage" ON notification_preferences FOR ALL USING (user_id = auth.uid());

-- NOTIFICATION LOGS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_service_only" ON notification_logs FOR ALL USING (false);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif_delete" ON notifications FOR DELETE USING (user_id = auth.uid());

-- PETS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pets_manage_self" ON pets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "pets_select_org" ON pets FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));

-- POLLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls_select" ON polls FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "polls_manage" ON polls FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- POLL OPTIONS
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_opts_select" ON poll_options FOR SELECT USING (poll_id IN (SELECT id FROM polls WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')));
CREATE POLICY "poll_opts_manage" ON poll_options FOR ALL USING (poll_id IN (SELECT id FROM polls WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active')));

-- POLL VOTES
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_select_self" ON poll_votes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "votes_insert" ON poll_votes FOR INSERT WITH CHECK (user_id = auth.uid() AND poll_id IN (SELECT id FROM polls WHERE status = 'active' AND organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')));

-- LOST AND FOUND ITEMS
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lf_select" ON lost_found_items FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "lf_insert" ON lost_found_items FOR INSERT WITH CHECK (reported_by = auth.uid() AND organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "lf_update_reporter" ON lost_found_items FOR UPDATE USING (reported_by = auth.uid());
CREATE POLICY "lf_update_claim" ON lost_found_items FOR UPDATE USING (type = 'found' AND status = 'open' AND organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));

-- DOCUMENTS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_select" ON documents FOR SELECT USING (is_active = true AND organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "docs_manage" ON documents FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'));

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE access_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE packages;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE amenity_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE pets;
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE lost_found_items;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- ============================================
-- DONE! All 24 tables created successfully
-- ============================================
