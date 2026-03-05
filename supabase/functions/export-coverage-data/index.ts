import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? '';
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const dataset = url.searchParams.get('dataset') || 'coverage'; // coverage | gaps | benchmarks | congestion
    const country = url.searchParams.get('country');
    const carrier = url.searchParams.get('carrier');
    const network = url.searchParams.get('network');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000'), 10000);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const demoMode = url.searchParams.get('demo') === 'true';
    const minUsers = demoMode ? 1 : 5;
    const minSamples = demoMode ? 5 : 20;
    // For congestion: filter by peak hours only
    const peakOnly = url.searchParams.get('peak_only') === 'true';
    // For gaps: minimum severity
    const minSeverity = parseInt(url.searchParams.get('min_severity') || '0');

    if (!['json', 'csv'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Use "json" or "csv"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validDatasets = ['coverage', 'gaps', 'benchmarks', 'congestion', 'qoe'];
    if (!validDatasets.includes(dataset)) {
      return new Response(
        JSON.stringify({ error: `Invalid dataset. Use one of: ${validDatasets.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // QoE-specific filters
    const minQoe = parseInt(url.searchParams.get('min_qoe') || '0');
    const streamingQuality = url.searchParams.get('streaming_quality');
    const gamingQuality = url.searchParams.get('gaming_quality');
    const qoeRating = url.searchParams.get('qoe_rating');

    let data: Record<string, unknown>[] | null = null;
    let datasetName = dataset;

    if (dataset === 'coverage') {
      // Original coverage tiles export
      let query = supabase
        .from('coverage_tiles')
        .select('*')
        .gte('unique_users', minUsers)
        .gte('sample_count', minSamples)
        .order('sample_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (country) query = query.eq('country_code', country.toUpperCase());
      if (carrier) query = query.ilike('carrier_name', `%${carrier}%`);
      if (network) query = query.eq('network_generation', network);

      const { data: tiles, error } = await query;
      if (error) throw error;
      data = tiles;

    } else if (dataset === 'gaps') {
      // Coverage gap detection
      let query = supabase
        .from('coverage_gaps')
        .select('*')
        .gte('severity_score', minSeverity)
        .order('severity_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (country) query = query.eq('country_code', country.toUpperCase());
      if (carrier) query = query.ilike('carrier_name', `%${carrier}%`);
      if (network) query = query.eq('network_generation', network);

      const { data: gaps, error } = await query;
      if (error) throw error;
      data = gaps;

    } else if (dataset === 'benchmarks') {
      // Carrier benchmarking
      let query = supabase
        .from('carrier_benchmarks')
        .select('*')
        .order('coverage_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (country) query = query.eq('country_code', country.toUpperCase());
      if (carrier) query = query.ilike('carrier_name', `%${carrier}%`);
      if (network) query = query.eq('network_generation', network);

      const { data: benchmarks, error } = await query;
      if (error) throw error;
      data = benchmarks;

    } else if (dataset === 'congestion') {
      // Network congestion detection
      let query = supabase
        .from('network_congestion')
        .select('*')
        .order('congestion_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (country) query = query.eq('country_code', country.toUpperCase());
      if (carrier) query = query.ilike('carrier_name', `%${carrier}%`);
      if (network) query = query.eq('network_generation', network);
      if (peakOnly) query = query.eq('is_peak_hour', true);

      const { data: congestion, error } = await query;
      if (error) throw error;
      data = congestion;

    } else if (dataset === 'qoe') {
      // Quality of Experience scores
      let query = supabase
        .from('network_qoe_scores')
        .select('*')
        .gte('qoe_score', minQoe)
        .order('qoe_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (country) query = query.eq('country_code', country.toUpperCase());
      if (carrier) query = query.ilike('carrier_name', `%${carrier}%`);
      if (network) query = query.eq('network_generation', network);
      if (streamingQuality) query = query.eq('streaming_quality', streamingQuality);
      if (gamingQuality) query = query.eq('gaming_quality', gamingQuality);
      if (qoeRating) query = query.eq('qoe_rating', qoeRating);

      const { data: qoe, error } = await query;
      if (error) throw error;
      data = qoe;
    }

    // Log successful export
    await supabase.from('webhook_logs').insert({
      event_type: 'b2b_export_success',
      payload: {
        dataset,
        format,
        filters: { country, carrier, network, peak_only: peakOnly, min_severity: minSeverity },
        rows_returned: data?.length || 0,
        limit,
        offset,
        demo_mode: demoMode
      },
      processed: true
    });

    // Return data
    if (format === 'csv') {
      const csvData = toCSV((data || []) as Record<string, unknown>[]);
      return new Response(csvData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${datasetName}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return new Response(
      JSON.stringify({
        data: data || [],
        meta: {
          dataset,
          total_returned: data?.length || 0,
          limit,
          offset,
          filters: { country, carrier, network, peak_only: peakOnly, min_severity: minSeverity },
          k_anonymity: { min_users: minUsers, min_samples: minSamples, demo_mode: demoMode },
          exported_at: new Date().toISOString(),
          available_datasets: validDatasets
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
