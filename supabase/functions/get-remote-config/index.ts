import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use anon client - RLS will filter to only non-sensitive rows
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Parse optional keys filter from request body
    let requestedKeys: string[] | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.keys && Array.isArray(body.keys)) {
          requestedKeys = body.keys;
        }
      } catch {
        // No body or invalid JSON - return all public config
      }
    }
    
    // Build query - RLS automatically filters is_sensitive=false
    let query = supabase
      .from('app_remote_config')
      .select('config_key, config_value');
    
    if (requestedKeys && requestedKeys.length > 0) {
      query = query.in('config_key', requestedKeys);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching config:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch config' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Transform to key-value object for easy client consumption
    const config: Record<string, unknown> = {};
    for (const row of data || []) {
      config[row.config_key] = row.config_value;
    }
    
    console.log(`Returned ${Object.keys(config).length} public config values`);
    
    return new Response(
      JSON.stringify({ config }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        } 
      }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});