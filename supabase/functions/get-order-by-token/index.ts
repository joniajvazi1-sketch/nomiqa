import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  accessToken: z.string().uuid()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid access token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check recent attempts from IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 'unknown';
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: rateLimitError } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'order_access_attempt')
      .gte('created_at', oneHourAgo)
      .limit(10);

    if (!rateLimitError && recentAttempts && recentAttempts.length >= 10) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this access attempt
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'order_access_attempt',
        payload: { ip: clientIP, token: accessToken.substring(0, 8) }
      });


    // Fetch order using service role to bypass RLS
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, products:product_id(*)')
      .eq('access_token', accessToken)
      .single();

    if (error || !order) {
      console.error('Order not found or error:', error);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired or invalidated
    if (order.access_token_invalidated) {
      return new Response(
        JSON.stringify({ error: 'Access token has been invalidated' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.access_token_expires_at && new Date(order.access_token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Access token has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch eSIM usage data if available
    let usageData = null;
    if (order.iccid) {
      const { data: usage } = await supabase
        .from('esim_usage')
        .select('*')
        .eq('order_id', order.id)
        .single();
      
      usageData = usage;
    }

    return new Response(
      JSON.stringify({ order, usage: usageData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
