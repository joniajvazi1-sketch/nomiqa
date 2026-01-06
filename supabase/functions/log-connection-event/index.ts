import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_EVENT_TYPES = ['lost', 'restored', 'type_change', 'roaming_change'];

// Round coordinates to 4 decimal places (~11m precision)
function roundCoordinate(value: number | null | undefined): number | null {
  if (value === null || value === undefined || isNaN(value)) return null;
  return Math.round(value * 10000) / 10000;
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
      event_type,
      from_state,
      to_state,
      network_type,
      carrier_name,
      is_roaming,
      latitude,
      longitude,
      accuracy_meters,
      recorded_at
    } = body;

    // Validate event_type
    if (!event_type || !ALLOWED_EVENT_TYPES.includes(event_type)) {
      console.warn(`Invalid event_type: ${event_type}`);
      return new Response(JSON.stringify({ 
        error: 'Invalid event_type',
        allowed: ALLOWED_EVENT_TYPES 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate recorded_at
    if (!recorded_at) {
      return new Response(JSON.stringify({ error: 'recorded_at is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use service role for insert
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session exists and belongs to user (if session_id provided)
    if (session_id) {
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
    }

    // Insert connection event
    const { data: insertedEvent, error: insertError } = await supabaseAdmin
      .from('connection_events')
      .insert({
        user_id: user.id,
        session_id: session_id || null,
        event_type,
        from_state: from_state || null,
        to_state: to_state || null,
        network_type: network_type || null,
        carrier_name: carrier_name || null,
        is_roaming: is_roaming ?? null,
        latitude: roundCoordinate(latitude),
        longitude: roundCoordinate(longitude),
        accuracy_meters: accuracy_meters || null,
        recorded_at
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to log connection event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[CONNECTION_EVENT] user=${user.id} type=${event_type} session=${session_id || 'none'}`);

    return new Response(JSON.stringify({ 
      success: true, 
      id: insertedEvent.id 
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
