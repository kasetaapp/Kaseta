-- ============================================
-- KASETA - Notifications Migration
-- Push tokens, preferences, logs
-- ============================================

-- ============================================
-- PUSH TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT, -- ios, android
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
-- NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
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
-- NOTIFICATION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL, -- visitor_arrival, package_received, announcement, maintenance_update, reservation_reminder, general
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
-- IN-APP NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- visitor_arrival, package_received, announcement, maintenance_update, reservation_reminder, system
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
-- RLS POLICIES - PUSH TOKENS
-- ============================================
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their push tokens"
  ON push_tokens FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - NOTIFICATION PREFERENCES
-- ============================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - NOTIFICATION LOGS
-- ============================================
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access notification logs
CREATE POLICY "Service role access only"
  ON notification_logs FOR ALL
  USING (false);

-- ============================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTION: Create Default Notification Preferences
-- ============================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_create_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
