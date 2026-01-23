-- KASETA Initial Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('residential', 'corporate', 'educational', 'industrial', 'healthcare', 'events')),
  slug TEXT UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units (houses, apartments, areas)
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  identifier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships (user <-> organization)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('resident', 'admin', 'guard', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_email TEXT,
  access_type TEXT DEFAULT 'single' CHECK (access_type IN ('single', 'multiple', 'permanent', 'temporary')),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  qr_code TEXT UNIQUE NOT NULL,
  short_code TEXT UNIQUE,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access logs
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  visitor_name TEXT,
  access_type TEXT CHECK (access_type IN ('entry', 'exit')),
  method TEXT CHECK (method IN ('qr_scan', 'manual_code', 'manual_entry')),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  authorized_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- Vehicles (optional for some verticals)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organization policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Units policies
CREATE POLICY "Users can view units in their organization" ON units
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Membership policies
CREATE POLICY "Users can view their own memberships" ON memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all memberships in their org" ON memberships
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true
    )
  );

-- Invitation policies
CREATE POLICY "Users can view invitations they created" ON invitations
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view invitations for their unit" ON invitations
  FOR SELECT USING (
    unit_id IN (
      SELECT unit_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create invitations for their unit" ON invitations
  FOR INSERT WITH CHECK (
    unit_id IN (
      SELECT unit_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their own invitations" ON invitations
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Guards can view all invitations in their org" ON invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('guard', 'admin', 'super_admin') AND is_active = true
    )
  );

-- Access log policies
CREATE POLICY "Guards can create access logs" ON access_logs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('guard', 'admin', 'super_admin') AND is_active = true
    )
  );

CREATE POLICY "Users can view access logs for their unit" ON access_logs
  FOR SELECT USING (
    unit_id IN (
      SELECT unit_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Guards can view all access logs in their org" ON access_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('guard', 'admin', 'super_admin') AND is_active = true
    )
  );

-- Vehicle policies
CREATE POLICY "Users can view vehicles in their unit" ON vehicles
  FOR SELECT USING (
    unit_id IN (
      SELECT unit_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage vehicles in their unit" ON vehicles
  FOR ALL USING (
    unit_id IN (
      SELECT unit_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate short code for invitations
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_unit_id ON invitations(unit_id);
CREATE INDEX IF NOT EXISTS idx_invitations_qr_code ON invitations(qr_code);
CREATE INDEX IF NOT EXISTS idx_invitations_short_code ON invitations(short_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_org_id ON access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at);
