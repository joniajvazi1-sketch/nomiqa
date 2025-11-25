import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AirloAuthResponse {
  data: {
    access_token: string;
    token_type: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    console.log('Manual provisioning for order:', orderId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products:product_id(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    console.log('Order found:', { id: order.id, email: order.email, status: order.status });

    // Check if already provisioned
    if (order.iccid) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already provisioned',
          iccid: order.iccid 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Airalo credentials
    const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
    const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const airloEnv = Deno.env.get('AIRLO_ENV') || 'production';

    if (!airloClientId || !airloClientSecret) {
      throw new Error('Airalo credentials not configured');
    }

    const baseUrl = airloEnv === 'sandbox' 
      ? 'https://sandbox-partners-api.airalo.com'
      : 'https://partners-api.airalo.com';

    console.log('Using Airalo:', airloEnv);

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: airloClientId,
        client_secret: airloClientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`Airalo auth failed: ${errorText}`);
    }

    const authData: AirloAuthResponse = await authResponse.json();
    console.log('Airalo access token obtained');

    // Submit order to Airalo
    const airloPackageId = order.products?.airlo_package_id;
    if (!airloPackageId) {
      throw new Error('Product airlo_package_id not found');
    }

    console.log('Submitting order to Airalo for package:', airloPackageId);
    
    const orderResponse = await fetch(`${baseUrl}/v2/orders/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `${authData.data.token_type} ${authData.data.access_token}`,
      },
      body: JSON.stringify({
        quantity: 1,
        package_id: airloPackageId,
        type: 'sim',
        description: `Manual provision - Order ${order.id}`,
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Airalo order failed: ${errorText}`);
    }

    const orderData = await orderResponse.json();
    console.log('Airalo order submitted:', orderData);

    // Update order with new airlo_request_id (from Airalo, not the paylink)
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'eSIM provisioning started. Airalo will send webhook with eSIM details within minutes.',
        airlo_request_id: orderData.data.id,
        order_id: orderId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Manual provision error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
