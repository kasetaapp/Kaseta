/**
 * KASETA - Notifications Service
 * Handles notification preferences sync with server
 */

import { supabase } from './supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  organization_id: string;
  push_enabled: boolean;
  access_alerts: boolean;
  invitation_alerts: boolean;
  security_alerts: boolean;
  marketing_emails: boolean;
  weekly_summary: boolean;
  push_token: string | null;
  device_type: string | null;
}

// Default preferences
const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id' | 'organization_id'> = {
  push_enabled: true,
  access_alerts: true,
  invitation_alerts: true,
  security_alerts: true,
  marketing_emails: false,
  weekly_summary: true,
  push_token: null,
  device_type: null,
};

// Register for push notifications and get token
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Get notification preferences
export async function getNotificationPreferences(
  organizationId: string
): Promise<NotificationPreferences | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    if (!data) {
      // Return default preferences if none exist
      return {
        ...DEFAULT_PREFERENCES,
        user_id: user.id,
        organization_id: organizationId,
      };
    }

    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error in getNotificationPreferences:', error);
    return null;
  }
}

// Save notification preferences
export async function saveNotificationPreferences(
  organizationId: string,
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: new Error('User not authenticated') };
    }

    // Get push token if enabling push notifications
    let pushToken = preferences.push_token;
    if (preferences.push_enabled && !pushToken) {
      pushToken = await registerForPushNotifications();
    }

    const prefsToSave = {
      user_id: user.id,
      organization_id: organizationId,
      push_enabled: preferences.push_enabled ?? DEFAULT_PREFERENCES.push_enabled,
      access_alerts: preferences.access_alerts ?? DEFAULT_PREFERENCES.access_alerts,
      invitation_alerts: preferences.invitation_alerts ?? DEFAULT_PREFERENCES.invitation_alerts,
      security_alerts: preferences.security_alerts ?? DEFAULT_PREFERENCES.security_alerts,
      marketing_emails: preferences.marketing_emails ?? DEFAULT_PREFERENCES.marketing_emails,
      weekly_summary: preferences.weekly_summary ?? DEFAULT_PREFERENCES.weekly_summary,
      push_token: pushToken,
      device_type: Platform.OS,
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(prefsToSave, {
        onConflict: 'user_id,organization_id',
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return { success: false, error: error as Error };
  }
}

// Update push token
export async function updatePushToken(
  organizationId: string,
  pushToken: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notification_preferences')
      .update({
        push_token: pushToken,
        device_type: Platform.OS,
      })
      .eq('user_id', user.id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating push token:', error);
    return false;
  }
}

// Clear push token (when logging out or disabling push)
export async function clearPushToken(organizationId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notification_preferences')
      .update({
        push_token: null,
      })
      .eq('user_id', user.id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error clearing push token:', error);
    return false;
  }
}

// Initialize notifications for a new organization membership
export async function initializeNotificationsForOrg(
  organizationId: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if preferences exist
    const existing = await getNotificationPreferences(organizationId);
    if (existing?.id) return; // Already initialized

    // Get push token
    const pushToken = await registerForPushNotifications();

    // Create default preferences
    await saveNotificationPreferences(organizationId, {
      ...DEFAULT_PREFERENCES,
      push_token: pushToken,
    });
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}
