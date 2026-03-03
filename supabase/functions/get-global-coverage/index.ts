import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PRIVACY: City-level grid size (~50km) - does NOT leak exact coordinates
const CITY_GRID_SIZE = 0.5;

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

// In-memory cache for performance
let cache: {
  data: any;
  timestamp: number;
} | null = null;

// Major city coordinates for display labels (approximate city centers)
const CITY_LABELS: Record<string, string> = {
  '48.0,11.5': 'Munich, DE',
  '48.5,11.5': 'Munich Area, DE',
  '52.5,13.5': 'Berlin, DE',
  '51.5,-0.5': 'London, UK',
  '48.5,2.5': 'Paris, FR',
  '40.5,-74.0': 'New York, US',
  '34.0,-118.5': 'Los Angeles, US',
  '37.5,-122.5': 'San Francisco, US',
  '35.5,139.5': 'Tokyo, JP',
  '1.5,103.5': 'Singapore',
  '-33.5,151.0': 'Sydney, AU',
};

interface GridCell {
  lat: number;
  lng: number;
  avgSignal: number;
  dataPoints: number;
  networkTypes: Record<string, number>;
  dominantNetwork: string;
  cityLabel?: string;
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

    // Get an accurate-ish total count (the API layer can cap returned rows at 1000)
    // PRIVACY: still only counts anonymized signal logs, no individual coordinates returned
    const { count: totalDataPointsCount, error: countError } = await supabase
      .from('signal_logs')
      .select('id', { count: 'estimated', head: true })
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

    // Query recent signal logs for aggregation
    // PRIVACY: we only aggregate, never return individual coords
    const { data: signalLogs, error } = await supabase
      .from('signal_logs')
      .select('latitude, longitude, rsrp, rssi, network_generation, network_type')
      .not('latitude', 'eq', 0)
      .not('longitude', 'eq', 0)
      .order('recorded_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('[get-global-coverage] Database error:', error);
      throw error;
    }

    const totalDataPoints = totalDataPointsCount ?? (signalLogs?.length || 0);

    if (!signalLogs || signalLogs.length === 0) {
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

    // PRIVACY: Aggregate into CITY-LEVEL grid cells (0.5 degree = ~50km)
    const gridCells: Map<string, GridCell> = new Map();

    for (const log of signalLogs) {
      // Round to city-level grid (0.5 degrees = ~50km)
      const cellLat = Math.floor(log.latitude / CITY_GRID_SIZE) * CITY_GRID_SIZE + CITY_GRID_SIZE / 2;
      const cellLng = Math.floor(log.longitude / CITY_GRID_SIZE) * CITY_GRID_SIZE + CITY_GRID_SIZE / 2;
      const cellKey = `${cellLat.toFixed(1)},${cellLng.toFixed(1)}`;

      // Calculate signal strength (0-1)
      let signalStrength = 0.5;
      if (log.rsrp !== null) {
        signalStrength = Math.min(1, Math.max(0, (log.rsrp + 140) / 96));
      } else if (log.rssi !== null) {
        signalStrength = Math.min(1, Math.max(0, (log.rssi + 100) / 70));
      }

      // Determine network type category
      const networkGen = (log.network_generation || log.network_type || 'unknown').toLowerCase();
      let networkCategory = 'lte'; // Default to LTE
      if (networkGen.includes('5g') || networkGen.includes('nr')) {
        networkCategory = '5g';
      } else if (networkGen.includes('4g') || networkGen.includes('lte')) {
        networkCategory = 'lte';
      } else if (networkGen.includes('3g') || networkGen.includes('umts') || networkGen.includes('hspa')) {
        networkCategory = '3g';
      }

      // Apply network filter if specified
      if (networkFilter && networkCategory !== networkFilter) {
        continue;
      }

      // Get city label if available
      const cityLabel = CITY_LABELS[cellKey];

      // Update or create grid cell
      const existing = gridCells.get(cellKey);
      if (existing) {
        existing.avgSignal = (existing.avgSignal * existing.dataPoints + signalStrength) / (existing.dataPoints + 1);
        existing.dataPoints++;
        existing.networkTypes[networkCategory] = (existing.networkTypes[networkCategory] || 0) + 1;
      } else {
        gridCells.set(cellKey, {
          lat: cellLat,
          lng: cellLng,
          avgSignal: signalStrength,
          dataPoints: 1,
          networkTypes: { [networkCategory]: 1 },
          dominantNetwork: networkCategory,
          cityLabel,
        });
      }
    }

    // Finalize cells - determine dominant network type
    const cells: Array<{
      lat: number;
      lng: number;
      intensity: number;
      network: string;
      count: number;
      label?: string;
    }> = [];

    for (const cell of gridCells.values()) {
      // Find dominant network
      let maxCount = 0;
      let dominant = 'lte';
      for (const [network, count] of Object.entries(cell.networkTypes)) {
        if (count > maxCount) {
          maxCount = count;
          dominant = network;
        }
      }

      cells.push({
        lat: cell.lat,
        lng: cell.lng,
        intensity: cell.avgSignal,
        network: dominant,
        count: cell.dataPoints,
        label: cell.cityLabel,
      });
    }

    // Calculate unique regions (rough country estimate based on lat/lng ranges)
    const uniqueRegions = new Set(cells.map(c => `${Math.floor(c.lat / 10)}`)).size;
    
    // Coverage area at city level
    const cellAreaKm2 = (CITY_GRID_SIZE * 111) * (CITY_GRID_SIZE * 111); // ~3000 km² per cell
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
