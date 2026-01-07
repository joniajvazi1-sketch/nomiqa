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

    // Check ownership - ONLY check user_id, never email (email field is now a placeholder)
    // Guest orders (user_id = NULL) must use access_token via get-order-by-token endpoint instead
    const order = esimUsage.orders as any;
    if (!order.user_id || order.user_id !== user.id) {
      console.log(`Authorization failed: order.user_id=${order.user_id}, user.id=${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - not your eSIM' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Limit to 1 request per minute per user per ICCID
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentRequests } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'esim_usage_fetch')
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (recentRequests && recentRequests.length > 0) {
      console.log(`Rate limit: User ${user.id} requesting too frequently for ICCID ${iccid}`);
      return new Response(
        JSON.stringify({ error: 'Please wait before refreshing usage data' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this usage fetch
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'esim_usage_fetch',
        payload: { user_id: user.id, iccid }
      });

    const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
    const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const airloEnv = Deno.env.get('AIRLO_ENV') || 'sandbox';
    
    const baseUrl = airloEnv === 'production' 
      ? 'https://partners-api.airalo.com'
      : 'https://sandbox-partners-api.airalo.com';

    // Get access token using FormData (required by Airalo API)
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', airloClientId!);
    tokenFormData.append('client_secret', airloClientSecret!);
    tokenFormData.append('grant_type', 'client_credentials');

    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      body: tokenFormData
    });

    if (!authResponse.ok) {
      const authErrorText = await authResponse.text();
      console.error('Airalo auth error:', authErrorText);
      throw new Error('Failed to authenticate with Airalo');
    }

    const authJson = await authResponse.json();
    const accessToken = authJson.data?.access_token;
    
    if (!accessToken) {
      console.error('No access token in response:', authJson);
      throw new Error('No access token received from Airalo');
    }
    
    console.log('Successfully got Airalo access token');

    // Get usage data from Airalo
    console.log(`Fetching usage for ICCID: ${iccid}`);
    const usageResponse = await fetch(`${baseUrl}/v2/sims/${iccid}/usage`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!usageResponse.ok) {
      const usageErrorText = await usageResponse.text();
      console.error('Airalo usage error:', usageResponse.status, usageErrorText);
      throw new Error(`Failed to fetch usage data: ${usageResponse.status}`);
    }

    const usageJson = await usageResponse.json();
    const usageData = usageJson.data;
    console.log('Airalo usage response:', JSON.stringify(usageData));

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