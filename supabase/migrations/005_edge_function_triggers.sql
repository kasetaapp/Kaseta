-- ============================================
-- KASETA - Edge Function Triggers Migration
-- Database triggers that invoke Edge Functions
-- ============================================

-- ============================================
-- FUNCTION: Notify Visitor Arrival
-- Called when a new access_log entry is created
-- ============================================
CREATE OR REPLACE FUNCTION notify_visitor_arrival()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Only trigger for visitor entries
  IF NEW.access_type IN ('invitation', 'manual') AND NEW.direction = 'entry' THEN
    -- Call the Edge Function via pg_net (if available) or http extension
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-visitor-arrival',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('access_log_id', NEW.id)
      );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error calling notify-visitor-arrival: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Uncomment this trigger after setting up pg_net extension
-- CREATE TRIGGER access_logs_notify_visitor
--   AFTER INSERT ON access_logs
--   FOR EACH ROW EXECUTE FUNCTION notify_visitor_arrival();

-- ============================================
-- FUNCTION: Notify Package Received
-- Called when a new package is logged
-- ============================================
CREATE OR REPLACE FUNCTION notify_package_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new packages in 'received' status
  IF NEW.status = 'received' THEN
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-package-received',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('package_id', NEW.id)
      );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error calling notify-package-received: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Uncomment this trigger after setting up pg_net extension
-- CREATE TRIGGER packages_notify_received
--   AFTER INSERT ON packages
--   FOR EACH ROW EXECUTE FUNCTION notify_package_received();

-- ============================================
-- FUNCTION: Auto-expire Invitations
-- Marks invitations as expired based on valid_until
-- ============================================
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

-- ============================================
-- FUNCTION: Mark Invitation as Used
-- Called when access is granted via invitation
-- ============================================
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

CREATE TRIGGER access_logs_mark_invitation_used
  AFTER INSERT ON access_logs
  FOR EACH ROW EXECUTE FUNCTION mark_invitation_used();

-- ============================================
-- FUNCTION: Update Reservation Status
-- Auto-complete past reservations
-- ============================================
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
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for key tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE access_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE packages;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE amenity_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- CRON JOBS (if pg_cron is enabled)
-- ============================================
-- Run every hour to expire invitations
-- SELECT cron.schedule('expire-invitations', '0 * * * *', 'SELECT expire_invitations()');

-- Run every hour to complete past reservations
-- SELECT cron.schedule('complete-reservations', '0 * * * *', 'SELECT complete_past_reservations()');
