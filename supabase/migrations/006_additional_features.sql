-- ============================================
-- KASETA - Additional Features Migration
-- Pets, Polls, Lost & Found, Documents
-- ============================================

-- ============================================
-- PETS
-- ============================================
CREATE TABLE IF NOT EXISTS pets (
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
-- POLLS
-- ============================================
CREATE TABLE IF NOT EXISTS polls (
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
-- POLL OPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);

-- ============================================
-- POLL VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS poll_votes (
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
-- LOST AND FOUND ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS lost_found_items (
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
-- DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
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
-- RLS POLICIES - PETS
-- ============================================
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their pets"
  ON pets FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can view org pets"
  ON pets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES - POLLS
-- ============================================
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org polls"
  ON polls FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage polls"
  ON polls FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES - POLL OPTIONS
-- ============================================
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view poll options"
  ON poll_options FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM polls WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Admins can manage poll options"
  ON poll_options FOR ALL
  USING (
    poll_id IN (
      SELECT id FROM polls WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
      )
    )
  );

-- ============================================
-- RLS POLICIES - POLL VOTES
-- ============================================
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their votes"
  ON poll_votes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    poll_id IN (
      SELECT id FROM polls
      WHERE status = 'active' AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- ============================================
-- RLS POLICIES - LOST AND FOUND
-- ============================================
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org items"
  ON lost_found_items FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create items"
  ON lost_found_items FOR INSERT
  WITH CHECK (
    reported_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update their items"
  ON lost_found_items FOR UPDATE
  USING (reported_by = auth.uid());

CREATE POLICY "Users can claim found items"
  ON lost_found_items FOR UPDATE
  USING (
    type = 'found' AND status = 'open' AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES - DOCUMENTS
-- ============================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  USING (
    is_active = true AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ============================================
-- FUNCTION: Increment Poll Vote Count
-- ============================================
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER poll_votes_increment
  AFTER INSERT ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION increment_vote_count();

-- ============================================
-- FUNCTION: Auto-close Expired Polls
-- ============================================
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

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER lost_found_items_updated_at
  BEFORE UPDATE ON lost_found_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE pets;
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE lost_found_items;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
