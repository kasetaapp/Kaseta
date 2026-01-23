/**
 * KASETA - Send Push Notification Edge Function
 * Sends push notifications via Expo Push Notification Service
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  categoryId?: string;
}

interface NotificationPayload {
  user_ids?: string[];
  unit_ids?: string[];
  organization_id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  notification_type: 'visitor_arrival' | 'package_received' | 'announcement' | 'maintenance_update' | 'reservation_reminder' | 'general';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { user_ids, unit_ids, organization_id, title, body, data, notification_type } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect push tokens based on targeting
    let pushTokens: string[] = [];

    if (user_ids && user_ids.length > 0) {
      // Send to specific users
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .in('user_id', user_ids);

      pushTokens = tokens?.map((t) => t.token) || [];
    } else if (unit_ids && unit_ids.length > 0) {
      // Send to all members of specific units
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id')
        .in('unit_id', unit_ids)
        .eq('status', 'active');

      const memberUserIds = members?.map((m) => m.user_id) || [];

      if (memberUserIds.length > 0) {
        const { data: tokens } = await supabase
          .from('push_tokens')
          .select('token')
          .in('user_id', memberUserIds);

        pushTokens = tokens?.map((t) => t.token) || [];
      }
    } else if (organization_id) {
      // Send to all members of an organization
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organization_id)
        .eq('status', 'active');

      const memberUserIds = members?.map((m) => m.user_id) || [];

      if (memberUserIds.length > 0) {
        const { data: tokens } = await supabase
          .from('push_tokens')
          .select('token')
          .in('user_id', memberUserIds);

        pushTokens = tokens?.map((t) => t.token) || [];
      }
    }

    if (pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove duplicates
    pushTokens = [...new Set(pushTokens)];

    // Filter valid Expo push tokens
    const validTokens = pushTokens.filter((token) =>
      token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
    );

    if (validTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No valid Expo push tokens' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build push messages (batch by 100)
    const messages: PushMessage[] = validTokens.map((token) => ({
      to: token,
      title,
      body,
      sound: 'default',
      data: {
        ...data,
        notification_type,
      },
      priority: notification_type === 'visitor_arrival' ? 'high' : 'default',
      channelId: getChannelId(notification_type),
    }));

    // Send in batches of 100
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }

    let totalSent = 0;
    const errors: any[] = [];

    for (const batch of batches) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();

      if (result.data) {
        result.data.forEach((ticket: any, index: number) => {
          if (ticket.status === 'ok') {
            totalSent++;
          } else if (ticket.status === 'error') {
            errors.push({
              token: batch[index].to,
              error: ticket.message,
              details: ticket.details,
            });

            // If token is invalid, remove it from database
            if (ticket.details?.error === 'DeviceNotRegistered') {
              supabase
                .from('push_tokens')
                .delete()
                .eq('token', batch[index].to)
                .then(() => {
                  console.log(`Removed invalid token: ${batch[index].to}`);
                });
            }
          }
        });
      }
    }

    // Log notification
    await supabase.from('notification_logs').insert({
      notification_type,
      title,
      body,
      recipients_count: validTokens.length,
      sent_count: totalSent,
      errors: errors.length > 0 ? errors : null,
      metadata: data,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        total: validTokens.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getChannelId(type: string): string {
  switch (type) {
    case 'visitor_arrival':
      return 'visitors';
    case 'package_received':
      return 'packages';
    case 'announcement':
      return 'announcements';
    case 'maintenance_update':
      return 'maintenance';
    case 'reservation_reminder':
      return 'reservations';
    default:
      return 'default';
  }
}
