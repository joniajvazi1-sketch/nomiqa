import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_QUALITY = ['excellent', 'good', 'poor', 'no_service'];
const ALLOWED_TRIGGER_REASONS = ['session_end', 'network_change', 'quality_drop', 'location_cluster', 'manual'];

// Bonus points for coverage confirmations (gold data)
const CONFIRMATION_POINTS = 10;
// Rate limit: 1 confirmation per 5 minutes unless session_end
const RATE_LIMIT_MINUTES = 5;

// Round coordinates to 4 decimal places (~11m precision)
function roundCoordinate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// Simple geohash encoder (precision 7 = ~150m)
function encodeGeohash(lat: number, lon: number, precision: number = 7): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isLon = true;

  while (hash.length < precision) {
    if (isLon) {
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) {
        ch |= (1 << (4 - bit));
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isLon = !isLon;
    if (bit < 4) {
      bit++;
    } else {
      hash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

// MCC to country code mapping (subset)
function getCountryFromMCC(mcc: string | null): string | null {
  if (!mcc) return null;
  const mccMap: Record<string, string> = {
    '310': 'US', '311': 'US', '312': 'US',
    '234': 'GB', '235': 'GB',
    '262': 'DE',
    '208': 'FR',
    '222': 'IT',
    '214': 'ES',
    '302': 'CA',
    '505': 'AU',
    '440': 'JP', '441': 'JP',
    '450': 'KR',
    '460': 'CN',
    '404': 'IN', '405': 'IN',
    '724': 'BR',
    '334': 'MX',
  };
  return mccMap[mcc] || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Verify user with anon client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const {
      session_id,
      quality,
      can_browse,
      can_stream,
      can_call,
      network_type,
      carrier_name,
      mcc,
      latitude,
      longitude,
      accuracy_meters,
      trigger_reason,
      recorded_at
    } = body;

    // Validate required fields
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'session_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!quality || !ALLOWED_QUALITY.includes(quality)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid quality',
        allowed: ALLOWED_QUALITY 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!trigger_reason || !ALLOWED_TRIGGER_REASONS.includes(trigger_reason)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid trigger_reason',
        allowed: ALLOWED_TRIGGER_REASONS 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (latitude === undefined || longitude === undefined) {
      return new Response(JSON.stringify({ error: 'latitude and longitude are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!recorded_at) {
      return new Response(JSON.stringify({ error: 'recorded_at is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session exists and belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('contribution_sessions')
      .select('id, user_id, status')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.warn(`Session not found: ${session_id}`);
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (session.user_id !== user.id) {
      console.warn(`Session ${session_id} does not belong to user ${user.id}`);
      return new Response(JSON.stringify({ error: 'Session does not belong to user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limit check - determines if bonus points are awarded (not if insert happens)
    let bonusAllowed = trigger_reason === 'session_end'; // session_end always gets bonus
    
    if (!bonusAllowed) {
      const rateLimitTime = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000).toISOString();
      const { data: recentConfirmations, error: rateError } = await supabaseAdmin
        .from('coverage_confirmations')
        .select('id, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', rateLimitTime)
        .limit(1);

      // If no recent confirmations, bonus is allowed
      bonusAllowed = !rateError && (!recentConfirmations || recentConfirmations.length === 0);
      
      if (!bonusAllowed) {
        console.log(`Rate limit: user ${user.id} already submitted within ${RATE_LIMIT_MINUTES} min - will insert but skip bonus`);
      }
    }

    // Find nearest signal log for anti-fraud (within last 5 minutes, 500m radius)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: nearbyLogs, error: logsError } = await supabaseAdmin
      .from('signal_logs')
      .select('id, latitude, longitude, recorded_at')
      .eq('user_id', user.id)
      .eq('session_id', session_id)
      .gte('recorded_at', fiveMinutesAgo)
      .order('recorded_at', { ascending: false })
      .limit(10);

    let nearestLogId: string | null = null;
    if (!logsError && nearbyLogs && nearbyLogs.length > 0) {
      // Find nearest log by simple distance check
      const roundedLat = roundCoordinate(latitude);
      const roundedLon = roundCoordinate(longitude);
      
      let minDistance = Infinity;
      for (const log of nearbyLogs) {
        const dLat = log.latitude - roundedLat;
        const dLon = log.longitude - roundedLon;
        const distance = Math.sqrt(dLat * dLat + dLon * dLon);
        if (distance < minDistance) {
          minDistance = distance;
          nearestLogId = log.id;
        }
      }
      
      // Reject if no log within ~500m (0.005 degrees approx)
      if (minDistance > 0.005) {
        console.warn(`No signal log within 500m of confirmation. Distance: ${minDistance}`);
        return new Response(JSON.stringify({ 
          error: 'No recent signal data nearby. Please confirm coverage during active contribution.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // No logs found at all within 5 minutes
      console.warn(`No signal logs found within 5 minutes for session ${session_id}`);
      return new Response(JSON.stringify({ 
        error: 'No recent signal data found. Start contributing before confirming coverage.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Derive geohash and country code
    const location_geohash = encodeGeohash(latitude, longitude, 7);
    const country_code = getCountryFromMCC(mcc);

    // Insert coverage confirmation
    const { data: insertedConfirmation, error: insertError } = await supabaseAdmin
      .from('coverage_confirmations')
      .insert({
        user_id: user.id,
        session_id,
        quality,
        can_browse: can_browse ?? null,
        can_stream: can_stream ?? null,
        can_call: can_call ?? null,
        network_type: network_type || null,
        carrier_name: carrier_name || null,
        nearest_log_id: nearestLogId,
        latitude: roundCoordinate(latitude),
        longitude: roundCoordinate(longitude),
        accuracy_meters: accuracy_meters || null,
        location_geohash,
        country_code,
        trigger_reason,
        recorded_at
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to submit coverage confirmation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Award bonus points only if rate limit allows
    let bonus_awarded = false;
    let bonus_points = 0;

    if (bonusAllowed) {
      bonus_points = CONFIRMATION_POINTS;
      
      // Get existing points and increment
      const { data: existingPoints } = await supabaseAdmin
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (existingPoints) {
        const { error: updateError } = await supabaseAdmin
          .from('user_points')
          .update({ 
            total_points: (existingPoints.total_points || 0) + bonus_points,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        bonus_awarded = !updateError;
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('user_points')
          .insert({
            user_id: user.id,
            total_points: bonus_points
          });
        
        bonus_awarded = !insertError;
      }
    }

    console.log(`[COVERAGE_CONFIRMATION] user=${user.id} quality=${quality} trigger=${trigger_reason} geohash=${location_geohash} bonus_awarded=${bonus_awarded} bonus_points=${bonus_points}`);

    return new Response(JSON.stringify({ 
      ok: true,
      confirmation_id: insertedConfirmation.id,
      bonus_awarded,
      bonus_points,
      rate_limited: !bonusAllowed,
      has_nearby_log: nearestLogId !== null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
