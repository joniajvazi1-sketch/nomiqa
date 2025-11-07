import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const usageRequestSchema = z.object({
  iccid: z.string().min(18).max(22)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT and get user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawBody = await req.json();
    const validationResult = usageRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { iccid } = validationResult.data;

    // Verify user owns this eSIM
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: esimUsage, error: esimError } = await supabase
      .from('esim_usage')
      .select('order_id, orders!inner(user_id, email)')
      .eq('iccid', iccid)
      .single();

    if (esimError || !esimUsage) {
      return new Response(
        JSON.stringify({ error: 'eSIM not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check ownership
    const order = esimUsage.orders as any;
    if (order.user_id !== user.id && order.email !== user.email) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - not your eSIM' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Update local database using the service client already initialized
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