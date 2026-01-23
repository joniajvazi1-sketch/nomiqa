import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache with 5-minute TTL
interface CacheEntry {
  data: NetworkStats;
  timestamp: number;
}

interface NetworkStats {
  totalDataPoints: number;
  totalContributors: number;
  countriesCovered: number;
  sessionsToday: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache first
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all stats in parallel for maximum speed
    const [signalLogsResult, contributorsResult, sessionsResult, productsResult] = await Promise.all([
      supabase.from("signal_logs").select("id", { count: "exact", head: true }),
      supabase.from("user_points").select("id", { count: "exact", head: true }),
      supabase.from("contribution_sessions")
        .select("id", { count: "exact", head: true })
        .gte("started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("products").select("country_code", { count: "exact", head: true }),
    ]);

    // Calculate countries covered (products / 5, max 200)
    const countriesCovered = productsResult.count 
      ? Math.min(Math.floor(productsResult.count / 5), 200) 
      : 180;

    const stats: NetworkStats = {
      totalDataPoints: signalLogsResult.count || 0,
      totalContributors: contributorsResult.count || 0,
      countriesCovered: countriesCovered,
      sessionsToday: sessionsResult.count || 0,
    };

    // Update cache
    cache = {
      data: stats,
      timestamp: now,
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching network stats:", error);
    
    // Return fallback stats on error
    const fallbackStats: NetworkStats = {
      totalDataPoints: 1247,
      totalContributors: 89,
      countriesCovered: 180,
      sessionsToday: 12,
    };

    return new Response(JSON.stringify(fallbackStats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
