import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Grid cell size in degrees (approximately 1km at equator)
const GRID_SIZE = 0.01;

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

// In-memory cache for performance
let cache: {
  data: any;
  timestamp: number;
} | null = null;

interface GridCell {
  lat: number;
  lng: number;
  avgSignal: number;
  dataPoints: number;
  networkTypes: Record<string, number>;
  dominantNetwork: string;
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
    const networkFilter = url.searchParams.get('network'); // '5g', 'lte', '3g'
    const minQuality = parseInt(url.searchParams.get('minQuality') || '0');
    const bounds = url.searchParams.get('bounds'); // 'minLat,minLng,maxLat,maxLng'
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Check cache (unless force refresh or filters applied)
    const hasFilters = networkFilter || minQuality > 0 || bounds;
    if (!forceRefresh && !hasFilters && cache && (Date.now() - cache.timestamp) < CACHE_DURATION * 1000) {
      console.log('[get-global-coverage] Returning cached data');
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[get-global-coverage] Fetching fresh data from database');

    // Build query for signal logs - anonymized (no user_id in response)
    let query = supabase
      .from('signal_logs')
      .select('latitude, longitude, rsrp, rssi, network_type, data_quality_score')
      .not('latitude', 'eq', 0)
      .not('longitude', 'eq', 0)
      .order('recorded_at', { ascending: false })
      .limit(50000); // Limit for performance

    // Apply quality filter
    if (minQuality > 0) {
      query = query.gte('data_quality_score', minQuality);
    }

    // Apply bounds filter if provided
    if (bounds) {
      const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
      query = query
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng);
    }

    const { data: signalLogs, error } = await query;

    if (error) {
      console.error('[get-global-coverage] Database error:', error);
      throw error;
    }

    if (!signalLogs || signalLogs.length === 0) {
      const emptyResponse = {
        cells: [],
        totalDataPoints: 0,
        uniqueLocations: 0,
        coverageAreaKm2: 0,
        lastUpdated: new Date().toISOString(),
      };
      return new Response(JSON.stringify(emptyResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Aggregate into grid cells
    const gridCells: Map<string, GridCell> = new Map();

    for (const log of signalLogs) {
      // Round to grid cell
      const cellLat = Math.floor(log.latitude / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
      const cellLng = Math.floor(log.longitude / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
      const cellKey = `${cellLat.toFixed(4)},${cellLng.toFixed(4)}`;

      // Calculate signal strength (0-1)
      let signalStrength = 0.5;
      if (log.rsrp !== null) {
        signalStrength = Math.min(1, Math.max(0, (log.rsrp + 140) / 96));
      } else if (log.rssi !== null) {
        signalStrength = Math.min(1, Math.max(0, (log.rssi + 100) / 70));
      }

      // Determine network type category
      const networkType = (log.network_type || 'unknown').toLowerCase();
      let networkCategory = 'other';
      if (networkType.includes('5g') || networkType.includes('nr')) {
        networkCategory = '5g';
      } else if (networkType.includes('lte') || networkType.includes('4g')) {
        networkCategory = 'lte';
      } else if (networkType.includes('3g') || networkType.includes('umts') || networkType.includes('hspa')) {
        networkCategory = '3g';
      }

      // Apply network filter if specified
      if (networkFilter && networkCategory !== networkFilter) {
        continue;
      }

      // Update or create grid cell
      const existing = gridCells.get(cellKey);
      if (existing) {
        // Running average
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
    }> = [];

    for (const cell of gridCells.values()) {
      // Find dominant network
      let maxCount = 0;
      let dominant = 'other';
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
      });
    }

    // Calculate coverage statistics
    const uniqueLocations = cells.length;
    // Approximate area: each cell is ~1km², but we use actual grid size
    const cellAreaKm2 = (GRID_SIZE * 111) * (GRID_SIZE * 111); // ~1.23 km² at equator
    const coverageAreaKm2 = Math.round(uniqueLocations * cellAreaKm2 * 100) / 100;

    const response = {
      cells,
      totalDataPoints: signalLogs.length,
      uniqueLocations,
      coverageAreaKm2,
      gridSizeDegrees: GRID_SIZE,
      lastUpdated: new Date().toISOString(),
      filters: {
        network: networkFilter,
        minQuality,
        bounds: bounds ? bounds.split(',').map(Number) : null,
      },
    };

    // Cache response (only if no filters)
    if (!hasFilters) {
      cache = {
        data: response,
        timestamp: Date.now(),
      };
    }

    console.log(`[get-global-coverage] Returning ${cells.length} cells from ${signalLogs.length} data points`);

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
