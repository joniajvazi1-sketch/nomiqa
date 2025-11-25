import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoverOrderRequest {
  orderId: string;
}

interface AirloAuthResponse {
  data: {
    access_token: string;
    token_type: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Manual Order Recovery Started ===');
    
    const { orderId }: RecoverOrderRequest = await req.json();
    console.log('Recovery requested for order:', orderId);

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      console.log('User does not have admin role');
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, proceeding with recovery');

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, product:product_id(airlo_package_id, name, country_name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order found:', {
      id: order.id,
      status: order.status,
      email: order.email,
      airlo_request_id: order.airlo_request_id,
      product: order.product
    });

    // Check if already provisioned
    if (order.iccid && order.qr_code_url) {
      console.log('Order already has eSIM details, sending confirmation email');
      
      // Just resend the confirmation email
      await supabase.functions.invoke('send-email', {
        body: {
          to: order.email,
          type: 'order-confirmation',
          data: {
            orderNumber: order.id,
            productName: order.package_name || order.product?.name,
            price: order.total_amount_usd,
            iccid: order.iccid,
            qrCodeUrl: order.qr_code_url,
            activationCode: order.activation_code,
            lpa: order.lpa
          }
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order already provisioned, confirmation email resent',
          order: order
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Airalo provisioning already started
    if (order.airlo_request_id) {
      console.log('Order already has airlo_request_id, waiting for webhook callback');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order provisioning already initiated, waiting for Airalo callback',
          airlo_request_id: order.airlo_request_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start Airalo provisioning
    console.log('Starting Airalo eSIM provisioning');

    const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
    const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const airloEnv = Deno.env.get('AIRLO_ENV') || 'production';

    if (!airloClientId || !airloClientSecret) {
      throw new Error('Airalo credentials not configured');
    }

    const baseUrl = airloEnv === 'sandbox' 
      ? 'https://sandbox-partners-api.airalo.com'
      : 'https://partners-api.airalo.com';

    console.log('Using Airalo environment:', airloEnv, 'Base URL:', baseUrl);

    // Get Airalo access token
    console.log('Requesting Airalo access token');
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
      console.error('Airalo auth failed:', authResponse.status, errorText);
      throw new Error(`Airalo authentication failed: ${errorText}`);
    }

    const authData: AirloAuthResponse = await authResponse.json();
    console.log('Airalo access token obtained');

    // Submit order to Airalo
    const airloPackageId = order.product?.airlo_package_id;
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
        description: `Manual recovery - Order ${order.id}`,
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Airalo order submission failed:', orderResponse.status, errorText);
      throw new Error(`Airalo order submission failed: ${errorText}`);
    }

    const orderData = await orderResponse.json();
    console.log('Airalo order submitted successfully:', orderData);

    // Update order with airlo_request_id
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        airlo_request_id: orderData.data.id,
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order with airlo_request_id:', updateError);
      throw updateError;
    }

    console.log('Order updated with airlo_request_id:', orderData.data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order recovery initiated, eSIM provisioning started. Wait for Airalo webhook callback.',
        order_id: orderId,
        airlo_request_id: orderData.data.id,
        note: 'The order will be automatically completed when Airalo sends the webhook with eSIM details.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recover-order function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
