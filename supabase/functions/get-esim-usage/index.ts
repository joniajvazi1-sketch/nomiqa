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
    const { iccid } = await req.json();

    if (!iccid) {
      throw new Error('ICCID is required');
    }

    const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
    const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const airloEnv = Deno.env.get('AIRLO_ENV') || 'sandbox';
    
    const baseUrl = airloEnv === 'production' 
      ? 'https://partners-api.airalo.com'
      : 'https://sandbox-partners-api.airalo.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: airloClientId,
        client_secret: airloClientSecret,
        grant_type: 'client_credentials'
      })
    });

    const { data: authData } = await authResponse.json();
    const accessToken = authData.access_token;

    // Get usage data from Airlo
    const usageResponse = await fetch(`${baseUrl}/v2/sims/${iccid}/usage`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!usageResponse.ok) {
      throw new Error('Failed to fetch usage data');
    }

    const { data: usageData } = await usageResponse.json();

    // Update local database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('esim_usage')
      .update({
        remaining_mb: usageData.remaining,
        total_mb: usageData.total,
        remaining_voice: usageData.remaining_voice || 0,
        remaining_text: usageData.remaining_text || 0,
        status: usageData.status,
        expired_at: usageData.expired_at,
        last_updated: new Date().toISOString()
      })
      .eq('iccid', iccid);

    return new Response(
      JSON.stringify(usageData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching usage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});