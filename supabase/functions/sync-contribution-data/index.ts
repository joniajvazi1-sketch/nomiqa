import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContributionData {
  session_id?: string;
  latitude: number;
  longitude: number;
  signal_dbm?: number;
  network_type?: string;
  carrier?: string;
  device_type?: string;
  speed_mps?: number;
  accuracy_meters?: number;
  recorded_at: string;
}

interface SyncRequest {
  contributions: ContributionData[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contributions }: SyncRequest = await req.json();

    if (!contributions || !Array.isArray(contributions) || contributions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No contributions to sync' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing ${contributions.length} contributions for user ${user.id}`);

    // Calculate points for each contribution
    let totalPointsEarned = 0;
    let totalDistanceMeters = 0;

    // Insert contributions to offline_contribution_queue
    const queueItems = contributions.map((c) => ({
      user_id: user.id,
      session_id: c.session_id || null,
      latitude: c.latitude,
      longitude: c.longitude,
      signal_dbm: c.signal_dbm,
      network_type: c.network_type,
      carrier: c.carrier,
      device_type: c.device_type,
      speed_mps: c.speed_mps,
      accuracy_meters: c.accuracy_meters,
      recorded_at: c.recorded_at,
      synced_at: new Date().toISOString(),
      processed: true
    }));

    const { error: insertError } = await supabase
      .from('offline_contribution_queue')
      .insert(queueItems);

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to sync contributions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also insert to mining_logs for legacy compatibility
    const miningLogs = contributions.map((c) => ({
      user_id: user.id,
      latitude: c.latitude,
      longitude: c.longitude,
      signal_dbm: c.signal_dbm,
      network_type: c.network_type,
      carrier: c.carrier,
      device_type: c.device_type
    }));

    await supabase.from('mining_logs').insert(miningLogs);

    // Calculate rough points (1 point per 10 meters of movement)
    // This is a simplified calculation - real calculation happens on device
    totalPointsEarned = Math.floor(contributions.length * 5); // ~5 points per data point

    // Update user_points
    const { data: existingPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPoints) {
      await supabase
        .from('user_points')
        .update({
          pending_points: (existingPoints.pending_points || 0) + totalPointsEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          total_points: 0,
          pending_points: totalPointsEarned,
          total_distance_meters: 0
        });
    }

    console.log(`Synced ${contributions.length} contributions, earned ${totalPointsEarned} points`);

    return new Response(
      JSON.stringify({
        success: true,
        synced_count: contributions.length,
        points_earned: totalPointsEarned
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});