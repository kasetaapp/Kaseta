/**
 * KASETA - Notify Visitor Arrival Edge Function
 * Triggered when a visitor arrives and is checked in by guard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisitorArrivalPayload {
  access_log_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: VisitorArrivalPayload = await req.json();
    const { access_log_id } = payload;

    if (!access_log_id) {
      return new Response(
        JSON.stringify({ error: 'access_log_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch access log with related data
    const { data: accessLog, error: logError } = await supabase
      .from('access_logs')
      .select(`
        *,
        invitation:invitation_id(
          visitor_name,
          unit_id
        ),
        unit:unit_id(
          unit_number,
          building
        )
      `)
      .eq('id', access_log_id)
      .single();

    if (logError || !accessLog) {
      return new Response(
        JSON.stringify({ error: 'Access log not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unit_id from either direct reference or invitation
    const unitId = accessLog.unit_id || accessLog.invitation?.unit_id;
    const visitorName = accessLog.visitor_name || accessLog.invitation?.visitor_name || 'Visitante';
    const unitNumber = accessLog.unit?.unit_number || 'N/A';
    const building = accessLog.unit?.building;

    if (!unitId) {
      return new Response(
        JSON.stringify({ error: 'No unit associated with this access' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all members of the unit
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('unit_id', unitId)
      .eq('status', 'active');

    const userIds = members?.map((m) => m.user_id) || [];

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No unit members found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, visitor_arrivals')
      .in('user_id', userIds);

    // Filter users who have visitor arrivals enabled (default true if no preference)
    const prefMap = new Map(preferences?.map((p) => [p.user_id, p.visitor_arrivals]) || []);
    const notifyUserIds = userIds.filter((uid) => prefMap.get(uid) !== false);

    if (notifyUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'All users have notifications disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', notifyUserIds);

    const pushTokens = tokens?.map((t) => t.token).filter(
      (token) => token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
    ) || [];

    if (pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build notification
    const locationStr = building ? `${building} - Unidad ${unitNumber}` : `Unidad ${unitNumber}`;
    const title = '🚶 Visitante llegó';
    const body = `${visitorName} ha llegado a ${locationStr}`;

    // Send push notifications
    const messages = pushTokens.map((token) => ({
      to: token,
      title,
      body,
      sound: 'default',
      data: {
        notification_type: 'visitor_arrival',
        access_log_id,
        unit_id: unitId,
      },
      priority: 'high',
      channelId: 'visitors',
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    let sentCount = 0;

    if (result.data) {
      result.data.forEach((ticket: any) => {
        if (ticket.status === 'ok') sentCount++;
      });
    }

    // Log the notification
    await supabase.from('notification_logs').insert({
      notification_type: 'visitor_arrival',
      title,
      body,
      recipients_count: pushTokens.length,
      sent_count: sentCount,
      metadata: { access_log_id, unit_id: unitId, visitor_name: visitorName },
    });

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: pushTokens.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
