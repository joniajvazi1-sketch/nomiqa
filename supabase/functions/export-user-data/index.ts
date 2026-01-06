import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log(`[GDPR_EXPORT] Starting data export for user=${user.id}`);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all user data in parallel
    const [
      signalLogsResult,
      coverageConfirmationsResult,
      connectionEventsResult,
      contributionSessionsResult,
      userPointsResult,
      profileResult,
      ordersResult
    ] = await Promise.all([
      // Signal logs (limit to last 90 days for performance)
      supabaseAdmin
        .from('signal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false }),

      // Coverage confirmations
      supabaseAdmin
        .from('coverage_confirmations')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false }),

      // Connection events
      supabaseAdmin
        .from('connection_events')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false }),

      // Contribution sessions
      supabaseAdmin
        .from('contribution_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false }),

      // User points
      supabaseAdmin
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // Profile
      supabaseAdmin
        .from('profiles')
        .select('username, email, is_early_member, solana_wallet, created_at')
        .eq('user_id', user.id)
        .single(),

      // Orders (non-PII only)
      supabaseAdmin
        .from('orders')
        .select('id, product_id, total_amount_usd, status, created_at, package_name, data_amount, validity_days')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile: profileResult.data || null,
      user_points: userPointsResult.data || null,
      signal_logs: {
        count: signalLogsResult.data?.length || 0,
        note: 'Limited to last 90 days',
        data: signalLogsResult.data || []
      },
      coverage_confirmations: {
        count: coverageConfirmationsResult.data?.length || 0,
        data: coverageConfirmationsResult.data || []
      },
      connection_events: {
        count: connectionEventsResult.data?.length || 0,
        data: connectionEventsResult.data || []
      },
      contribution_sessions: {
        count: contributionSessionsResult.data?.length || 0,
        data: contributionSessionsResult.data || []
      },
      orders: {
        count: ordersResult.data?.length || 0,
        note: 'PII excluded for security',
        data: ordersResult.data || []
      }
    };

    console.log(`[GDPR_EXPORT] Completed for user=${user.id}: signal_logs=${exportData.signal_logs.count}, confirmations=${exportData.coverage_confirmations.count}, events=${exportData.connection_events.count}, sessions=${exportData.contribution_sessions.count}`);

    return new Response(JSON.stringify(exportData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nomiqa-data-export-${new Date().toISOString().split('T')[0]}.json"`
      }
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
