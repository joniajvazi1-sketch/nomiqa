import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get user points
    const { data: points, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get recent sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('contribution_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get affiliate data for miner boost
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('miner_boost_percentage, registration_milestone_level')
      .eq('user_id', user.id)
      .maybeSingle();

    // Calculate streak
    let streakDays = 0;
    if (points?.last_contribution_date) {
      const lastDate = new Date(points.last_contribution_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streakDays = points.contribution_streak_days || 0;
      }
    }

    // Calculate rank (simplified - just count users with more points)
    const { count: usersAbove } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', points?.total_points || 0);

    const rank = (usersAbove || 0) + 1;

    return new Response(
      JSON.stringify({
        points: {
          total: points?.total_points || 0,
          pending: points?.pending_points || 0,
          total_distance_meters: points?.total_distance_meters || 0,
          total_contribution_time_seconds: points?.total_contribution_time_seconds || 0,
          streak_days: streakDays
        },
        boost: {
          percentage: affiliate?.miner_boost_percentage || 0,
          milestone_level: affiliate?.registration_milestone_level || 0
        },
        rank,
        recent_sessions: recentSessions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});