import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PRIVACY: City-level grid size (~25km) - does NOT leak exact coordinates
// Smaller grid to distinguish nearby cities (e.g. Munich vs Augsburg)
const CITY_GRID_SIZE = 0.25;

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

// In-memory cache for performance
let cache: {
  data: any;
  timestamp: number;
} | null = null;

// City labels are now resolved client-side via getApproximateLocation()

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query params for optional filters
    const url = new URL(req.url);
    const networkFilter = url.searchParams.get('network');
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Check cache (unless force refresh)
    if (!forceRefresh && !networkFilter && cache && (Date.now() - cache.timestamp) < CACHE_DURATION * 1000) {
      console.log('[get-global-coverage] Returning cached data');
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[get-global-coverage] Fetching fresh data from database');

    // Get EXACT total count of all signal logs (not estimated)
    const { count: totalDataPointsCount, error: countError } = await supabase
      .from('signal_logs')
      .select('id', { count: 'exact', head: true })
      .not('latitude', 'eq', 0)
      .not('longitude', 'eq', 0);

    if (countError) {
      console.warn('[get-global-coverage] Count query warning:', countError);
    }

    // Get ALL-TIME unique city-level grid cells (stable, never decreases)
    // Uses ~50km grid: FLOOR(lat/0.5), FLOOR(lng/0.5) = one "city"
    const { data: cityCountData } = await supabase
      .rpc('get_all_time_city_count');
    const allTimeCityCount = cityCountData ?? 0;

    // Get stable tile count from coverage_tiles materialized view
    const { count: stableTileCount } = await supabase
      .from('coverage_tiles')
      .select('location_geohash', { count: 'exact', head: true });

    // Get total user count (all registered users)
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    // Query ALL signal logs aggregated at city-level grid directly in SQL
    // This ensures ALL cities get dots, not just those in a 5000-row sample
    const { data: aggregatedCells, error } = await supabase
      .rpc('get_coverage_grid_cells');

    if (error) {
      console.error('[get-global-coverage] Database error:', error);
      throw error;
    }

    const totalDataPoints = totalDataPointsCount ?? 0;

    if (!aggregatedCells || aggregatedCells.length === 0) {
      const emptyResponse = {
        cells: [],
        totalDataPoints: 0,
        uniqueLocations: 0,
        coverageAreaKm2: 0,
        countriesCount: 0,
        lastUpdated: new Date().toISOString(),
      };
      return new Response(JSON.stringify(emptyResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build cells from pre-aggregated data
    const cells = aggregatedCells
      .filter((cell: any) => !networkFilter || cell.dominant_network === networkFilter)
      .map((cell: any) => ({
        lat: cell.lat,
        lng: cell.lng,
        intensity: cell.avg_signal,
        network: cell.dominant_network || 'lte',
        count: cell.data_points,
      }));

    // Calculate unique regions (rough country estimate based on lat/lng ranges)
    const uniqueRegions = new Set(cells.map((c: any) => `${Math.floor(c.lat / 10)}`)).size;
    
    // Coverage area at city level
    const cellAreaKm2 = (CITY_GRID_SIZE * 111) * (CITY_GRID_SIZE * 111);
    const coverageAreaKm2 = Math.round(cells.length * cellAreaKm2);

    const response = {
      cells,
      totalDataPoints,
      uniqueLocations: stableTileCount || cells.length,
      allTimeCities: allTimeCityCount,
      coverageAreaKm2,
      countriesCount: uniqueRegions,
      totalContributors: totalUsers || 0,
      gridSizeKm: Math.round(CITY_GRID_SIZE * 111),
      lastUpdated: new Date().toISOString(),
    };

    // Cache response (only if no filters)
    if (!networkFilter) {
      cache = {
        data: response,
        timestamp: Date.now(),
      };
    }

    console.log(`[get-global-coverage] Returning ${cells.length} city-level cells from ${totalDataPoints} data points`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[get-global-coverage] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch global coverage data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
