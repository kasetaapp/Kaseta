-- KASETA Migration: Notification Preferences
-- Stores user notification settings synced with server

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Push notification settings
  push_enabled BOOLEAN DEFAULT true,

  -- Alert types
  access_alerts BOOLEAN DEFAULT true,
  invitation_alerts BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,

  -- Email settings
  marketing_emails BOOLEAN DEFAULT false,
  weekly_summary BOOLEAN DEFAULT true,

  -- Push token for sending notifications
  push_token TEXT,
  device_type TEXT, -- 'ios' or 'android'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences" ON notification_preferences
  FOR DELETE USING (user_id = auth.uid());

-- Admins can view preferences in their organization (for sending notifications)
CREATE POLICY "Admins can view org notification preferences" ON notification_preferences
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_org_id ON notification_preferences(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_push_token ON notification_preferences(push_token);

-- Trigger to update updated_at
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to get users to notify for an event
CREATE OR REPLACE FUNCTION get_users_to_notify(
  p_organization_id UUID,
  p_unit_id UUID DEFAULT NULL,
  p_alert_type TEXT DEFAULT 'access'
)
RETURNS TABLE (
  user_id UUID,
  push_token TEXT,
  device_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    np.user_id,
    np.push_token,
    np.device_type
  FROM notification_preferences np
  INNER JOIN memberships m ON m.user_id = np.user_id AND m.organization_id = np.organization_id
  WHERE np.organization_id = p_organization_id
    AND np.push_enabled = true
    AND np.push_token IS NOT NULL
    AND m.is_active = true
    AND (
      (p_alert_type = 'access' AND np.access_alerts = true) OR
      (p_alert_type = 'invitation' AND np.invitation_alerts = true) OR
      (p_alert_type = 'security' AND np.security_alerts = true)
    )
    AND (p_unit_id IS NULL OR m.unit_id = p_unit_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
