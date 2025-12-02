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

    // Get access token using FormData (required by Airalo API)
    console.log('Getting Airalo access token...');
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', airloClientId!);
    tokenFormData.append('client_secret', airloClientSecret!);
    tokenFormData.append('grant_type', 'client_credentials');
    
    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: tokenFormData
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Airalo auth failed:', errorText);
      throw new Error(`Airalo auth failed: ${errorText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.data.access_token;
    console.log('Access token obtained');

    // Submit order using sync API with FormData
    const packageId = order.products?.airlo_package_id;
    if (!packageId) {
      throw new Error('Product package ID not found');
    }

    console.log('Submitting Airalo sync order for package:', packageId);
    
    const formData = new FormData();
    formData.append('package_id', packageId);
    formData.append('quantity', '1');
    formData.append('type', 'sim');
    formData.append('description', `Manual recovery - ${order.id}`);
    formData.append('brand_settings_name', 'Nomiqa');
    formData.append('to_email', order.email);
    
    const airloOrderResponse = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: formData
    });

    const airloResponseText = await airloOrderResponse.text();
    console.log('Airalo response:', airloResponseText);

    if (!airloOrderResponse.ok) {
      console.error('Airalo order failed:', airloResponseText);
      throw new Error(`Airalo order failed: ${airloResponseText}`);
    }

    const airloOrderData = JSON.parse(airloResponseText);
    const orderData = airloOrderData.data;
    console.log('Airalo order successful:', orderData.id);

    // Extract eSIM details from sync response
    const sim = orderData.sims?.[0];
    if (!sim) {
      throw new Error('No eSIM data in Airalo response');
    }

    // Update order with complete eSIM details
    await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        airlo_order_id: orderData.id?.toString(),
        iccid: sim.iccid,
        lpa: sim.lpa,
        matching_id: sim.matching_id,
        qrcode: sim.qrcode,
        qr_code_url: sim.qrcode_url,
        activation_code: sim.matching_id,
        manual_installation: orderData.manual_installation,
        qrcode_installation: orderData.qrcode_installation,
        sharing_link: orderData.sharing?.link,
        sharing_access_code: orderData.sharing?.access_code,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Create eSIM usage record
    await supabase.from('esim_usage').insert({
      order_id: order.id,
      iccid: sim.iccid,
      total_mb: parseInt(order.data_amount) * 1024 || 0,
      remaining_mb: parseInt(order.data_amount) * 1024 || 0,
      status: 'NOT_ACTIVE'
    });

    console.log('Order completed successfully');
    console.log('ICCID:', sim.iccid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'eSIM provisioned successfully! Airalo has sent the eSIM details to your email.',
        iccid: sim.iccid,
        sharing_link: orderData.sharing?.link
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
