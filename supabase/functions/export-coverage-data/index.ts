import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface CoverageTile {
  location_geohash: string;
  country_code: string;
  carrier_name: string;
  network_generation: string;
  sample_count: number;
  unique_users: number;
  first_seen: string;
  last_updated: string;
  median_rsrp: number;
  median_rsrq: number;
  median_sinr: number;
  avg_rsrp: number;
  median_download_mbps: number;
  median_upload_mbps: number;
  median_latency_ms: number;
  avg_download_mbps: number;
  avg_latency_ms: number;
  pct_excellent_signal: number;
  pct_good_signal: number;
  pct_poor_signal: number;
  avg_confidence: number;
  high_confidence_samples: number;
  pct_roaming: number;
}

function toCSV(data: CoverageTile[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h as keyof CoverageTile];
      // Escape values with commas or quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? '';
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing X-API-Key header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for config access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate API key against stored keys
    const { data: configData, error: configError } = await supabase
      .from('app_remote_config')
      .select('config_value')
      .eq('config_key', 'b2b_api_keys')
      .single();

    if (configError || !configData) {
      console.error('Failed to fetch API keys config:', configError);
      return new Response(
        JSON.stringify({ error: 'API key validation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validKeys = configData.config_value as string[];
    if (!validKeys.includes(apiKey)) {
      // Log invalid API key attempt
      await supabase.from('security_audit_log').insert({
        event_type: 'invalid_b2b_api_key',
        severity: 'warn',
        details: { 
          key_prefix: apiKey.substring(0, 8) + '...',
          endpoint: 'export-coverage-data'
        }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    const country = url.searchParams.get('country');
    const carrier = url.searchParams.get('carrier');
    const network = url.searchParams.get('network');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000'), 10000);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    // Demo mode: lower thresholds for pre-launch demos (use ?demo=true)
    const demoMode = url.searchParams.get('demo') === 'true';
    const minUsers = demoMode ? 1 : 5;
    const minSamples = demoMode ? 5 : 20;

    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Use "json" or "csv"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query coverage_tiles with K-anonymity thresholds
    let query = supabase
      .from('coverage_tiles')
      .select('*')
      .gte('unique_users', minUsers)
      .gte('sample_count', minSamples)
      .order('sample_count', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (country) {
      query = query.eq('country_code', country.toUpperCase());
    }
    if (carrier) {
      query = query.ilike('carrier_name', `%${carrier}%`);
    }
    if (network) {
      query = query.eq('network_generation', network);
    }

    const { data: tiles, error: queryError, count } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch coverage data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful export
    await supabase.from('webhook_logs').insert({
      event_type: 'b2b_export_success',
      payload: {
        format,
        filters: { country, carrier, network },
        rows_returned: tiles?.length || 0,
        limit,
        offset
      },
      processed: true
    });

    // Return data in requested format
    if (format === 'csv') {
      const csvData = toCSV(tiles as CoverageTile[]);
      return new Response(csvData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="coverage_data_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // JSON format (default)
    return new Response(
      JSON.stringify({
        data: tiles,
        meta: {
          total_returned: tiles?.length || 0,
          limit,
          offset,
          filters: { country, carrier, network },
          k_anonymity: { min_users: minUsers, min_samples: minSamples, demo_mode: demoMode },
          exported_at: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
