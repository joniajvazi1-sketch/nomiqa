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

    if (pointsError) {
      console.error('Points error:', pointsError);
    }

    // Get affiliate data for miner boost
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('miner_boost_percentage, registration_milestone_level')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get monthly status using the new RPC function
    const { data: monthlyStatus } = await supabase
      .rpc('get_user_monthly_status', { p_user_id: user.id });

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

    // Get weekly contribution data (last 7 days) for chart
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    
    const { data: sessionsData } = await supabase
      .from('contribution_sessions')
      .select('started_at, total_points_earned')
      .eq('user_id', user.id)
      .gte('started_at', weekAgo.toISOString())
      .order('started_at', { ascending: true })
      .limit(500);

    // Aggregate by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyPoints: Record<string, number> = {};
    
    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo);
      date.setDate(date.getDate() + i);
      const dayName = dayNames[date.getDay()];
      dailyPoints[`${i}-${dayName}`] = 0;
    }
    
    // Sum points per day
    sessionsData?.forEach((session: { started_at: string; total_points_earned: number | null }) => {
      const sessionDate = new Date(session.started_at);
      const daysSinceStart = Math.floor((sessionDate.getTime() - weekAgo.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart >= 0 && daysSinceStart < 7) {
        const dayName = dayNames[sessionDate.getDay()];
        const key = `${daysSinceStart}-${dayName}`;
        dailyPoints[key] = (dailyPoints[key] || 0) + (session.total_points_earned || 0);
      }
    });

    // Convert to array format for chart
    const weeklyData = Object.entries(dailyPoints)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([key, value]) => ({
        day: key.split('-')[1],
        value: Number(value)
      }));

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
        weekly_data: weeklyData,
        monthly: {
          points_this_month: monthlyStatus?.points_this_month || 0,
          monthly_cap: monthlyStatus?.monthly_cap || 6000,
          remaining_monthly: monthlyStatus?.remaining_monthly || 6000,
          month_key: monthlyStatus?.month_key || ''
        }
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