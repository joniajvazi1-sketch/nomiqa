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
    // Get the authenticated user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract JWT token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
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
      console.warn(`Unauthorized provision attempt by user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== Manual eSIM Provisioning ===');
    console.log('Order ID:', orderId);
    console.log('Admin user:', user.email);

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products:product_id(airlo_package_id, name, country_name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order found:', { email: order.email, status: order.status });

    // Check if already has eSIM
    if (order.iccid) {
      console.log('Order already has eSIM');
      
      // Resend email
      await supabase.functions.invoke('send-email', {
        body: {
          to: order.email,
          type: 'order-confirmation',
          data: {
            orderNumber: order.id,
            productName: order.package_name,
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
          message: 'Already provisioned. Confirmation email resent.',
          iccid: order.iccid 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Airalo credentials
    const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
    const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const airloEnv = Deno.env.get('AIRLO_ENV') || 'production';

    const baseUrl = airloEnv === 'sandbox' 
      ? 'https://sandbox-partners-api.airalo.com'
      : 'https://partners-api.airalo.com';

    console.log('Airalo environment:', airloEnv);

    // Get access token
    console.log('Getting Airalo access token...');
    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: airloClientId,
        client_secret: airloClientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Airalo auth failed:', errorText);
      throw new Error(`Airalo auth failed: ${errorText}`);
    }

    const authData = await authResponse.json();
    console.log('Access token obtained');

    // Submit order
    const packageId = order.products?.airlo_package_id;
    if (!packageId) {
      throw new Error('Product package ID not found');
    }

    console.log('Submitting Airalo order for package:', packageId);
    
    const airloOrderResponse = await fetch(`${baseUrl}/v2/orders-async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.data.access_token}`,
      },
      body: JSON.stringify({
        quantity: 1,
        package_id: packageId,
        type: 'sim',
        description: `Manual recovery - ${order.id}`,
      }),
    });

    if (!airloOrderResponse.ok) {
      const errorText = await airloOrderResponse.text();
      console.error('Airalo order failed:', errorText);
      throw new Error(`Airalo order failed: ${errorText}`);
    }

    const airloOrderData = await airloOrderResponse.json();
    console.log('Airalo order submitted successfully');
    console.log('Airalo request ID:', airloOrderData.data.id);

    // Update order status
    await supabase
      .from('orders')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'eSIM provisioning initiated! Airalo will send eSIM details via webhook within 1-2 minutes. Customer will receive email automatically.',
        airlo_request_id: airloOrderData.data.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
