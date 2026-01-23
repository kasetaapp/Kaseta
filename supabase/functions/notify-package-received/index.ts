/**
 * KASETA - Notify Package Received Edge Function
 * Triggered when a package is logged by the guard
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PackageReceivedPayload {
  package_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PackageReceivedPayload = await req.json();
    const { package_id } = payload;

    if (!package_id) {
      return new Response(
        JSON.stringify({ error: 'package_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch package with related data
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select(`
        *,
        unit:unit_id(
          unit_number,
          building
        )
      `)
      .eq('id', package_id)
      .single();

    if (pkgError || !pkg) {
      return new Response(
        JSON.stringify({ error: 'Package not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const unitId = pkg.unit_id;
    const unitNumber = pkg.unit?.unit_number || 'N/A';
    const building = pkg.unit?.building;
    const carrier = pkg.carrier || 'Paquete';

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
      .select('user_id, package_arrivals')
      .in('user_id', userIds);

    // Filter users who have package notifications enabled
    const prefMap = new Map(preferences?.map((p) => [p.user_id, p.package_arrivals]) || []);
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
    const title = '📦 Paquete recibido';
    const body = `Tienes un paquete de ${carrier} esperando en caseta`;

    // Send push notifications
    const messages = pushTokens.map((token) => ({
      to: token,
      title,
      body,
      sound: 'default',
      data: {
        notification_type: 'package_received',
        package_id,
        unit_id: unitId,
      },
      priority: 'default',
      channelId: 'packages',
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
      notification_type: 'package_received',
      title,
      body,
      recipients_count: pushTokens.length,
      sent_count: sentCount,
      metadata: { package_id, unit_id: unitId, carrier },
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
