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
    const { packageId, email, userId } = await req.json();

    if (!packageId || !email) {
      throw new Error('Package ID and email are required');
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

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Airlo');
    }

    const { data: authData } = await authResponse.json();
    const accessToken = authData.access_token;

    // Submit async order
    const orderResponse = await fetch(`${baseUrl}/v2/orders-async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        package_id: packageId,
        quantity: 1,
        type: 'sim',
        description: `Order for ${email}`
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(`Airlo order failed: ${JSON.stringify(errorData)}`);
    }

    const { data: orderData } = await orderResponse.json();
    
    // Get product details
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('airlo_package_id', packageId)
      .single();

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        product_id: product?.id,
        email,
        total_amount_usd: product?.price_usd || 0,
        status: 'pending',
        airlo_request_id: orderData.request_id,
        package_name: product?.name,
        data_amount: product?.data_amount,
        validity_days: product?.validity_days
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        order,
        airlo_request_id: orderData.request_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});