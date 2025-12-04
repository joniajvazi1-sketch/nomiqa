import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for retrying fetch requests with exponential backoff
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt}/${maxRetries} to ${url}`);
      const response = await fetch(url, options);
      
      // Retry on 5xx errors (server errors, timeouts)
      if (response.status >= 500 && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Got ${response.status}, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Fetch error: ${err}, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError || new Error('Max retries exceeded');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Retrying eSIM provisioning for order:', orderId);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(airlo_package_id)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status !== 'paid') {
      return new Response(
        JSON.stringify({ error: `Order status is ${order.status}, not 'paid'. Cannot retry.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Airalo credentials
    const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
    const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const airloEnv = Deno.env.get('AIRLO_ENV') || 'sandbox';
    
    if (!airloClientId || !airloClientSecret) {
      throw new Error('Missing Airalo API credentials');
    }
    
    const baseUrl = airloEnv === 'production' 
      ? 'https://partners-api.airalo.com'
      : 'https://sandbox-partners-api.airalo.com';

    console.log('Getting Airalo access token...');
    
    // Get access token
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', airloClientId);
    tokenFormData.append('client_secret', airloClientSecret);
    tokenFormData.append('grant_type', 'client_credentials');
    
    const authResponse = await fetchWithRetry(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: tokenFormData
    });

    if (!authResponse.ok) {
      const authText = await authResponse.text();
      throw new Error(`Failed to authenticate with Airalo: ${authResponse.status} - ${authText}`);
    }

    const authJson = await authResponse.json();
    const accessToken = authJson.data.access_token;
    console.log('Got Airalo access token');

    // Get package ID
    const packageId = order.products?.airlo_package_id;
    if (!packageId) {
      throw new Error('Product not found or missing Airalo package ID');
    }

    // Submit order to Airalo
    console.log('Submitting eSIM order to Airalo...');
    
    const formData = new FormData();
    formData.append('package_id', packageId);
    formData.append('quantity', '1');
    formData.append('type', 'sim');
    formData.append('description', `Order ${order.id} for ${order.email}`);
    formData.append('brand_settings_name', 'Nomiqa');
    formData.append('to_email', order.email);
    if (order.full_name) {
      formData.append('to_name', order.full_name);
    }
    formData.append('sharing_option[]', 'link');
    formData.append('sharing_option[]', 'pdf');
    
    const orderResponse = await fetchWithRetry(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData
    });

    const orderResponseText = await orderResponse.text();
    console.log('Order response status:', orderResponse.status);
    console.log('Order response body:', orderResponseText);

    if (!orderResponse.ok) {
      throw new Error(`Airalo order failed: ${orderResponse.status} - ${orderResponseText}`);
    }

    const orderJson = JSON.parse(orderResponseText);
    const { data: orderData } = orderJson;
    const sim = orderData.sims?.[0];
    
    if (!sim) {
      throw new Error('No eSIM data in Airalo response');
    }

    // Update order with eSIM details
    console.log('Updating order in database...');
    const { error: updateError } = await supabase
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
        sharing_link: sim.sharing?.link,
        sharing_access_code: sim.sharing?.access_code,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    console.log('✓ Order updated to completed');

    // Create eSIM usage record
    await supabase.from('esim_usage').insert({
      order_id: order.id,
      iccid: sim.iccid,
      total_mb: parseInt(order.data_amount) || 0,
      remaining_mb: parseInt(order.data_amount) || 0,
      status: 'NOT_ACTIVE'
    });

    // Update user spending
    if (order.user_id) {
      const { data: currentSpending } = await supabase
        .from('user_spending')
        .select('total_spent_usd')
        .eq('user_id', order.user_id)
        .maybeSingle();

      const newTotalSpent = (currentSpending?.total_spent_usd || 0) + order.total_amount_usd;

      if (currentSpending) {
        await supabase
          .from('user_spending')
          .update({ total_spent_usd: newTotalSpent, updated_at: new Date().toISOString() })
          .eq('user_id', order.user_id);
      } else {
        await supabase
          .from('user_spending')
          .insert({ user_id: order.user_id, total_spent_usd: order.total_amount_usd });
      }
      console.log(`✓ User spending updated: $${newTotalSpent.toFixed(2)}`);
    }

    // Process affiliate commission
    if (order.referral_code) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, tier_level, total_conversions, total_earnings_usd, email')
        .eq('affiliate_code', order.referral_code)
        .eq('status', 'active')
        .maybeSingle();

      if (affiliate) {
        const commissionRate = 0.09; // 9% direct
        const commission = order.total_amount_usd * commissionRate;

        // Record conversion
        await supabase.from('affiliate_referrals').insert({
          affiliate_id: affiliate.id,
          order_id: order.id,
          commission_amount_usd: commission,
          commission_level: 1,
          status: 'converted',
          converted_at: new Date().toISOString(),
          visitor_id: order.visitor_id || order.user_id
        });

        // Update affiliate stats
        await supabase
          .from('affiliates')
          .update({
            total_conversions: (affiliate.total_conversions || 0) + 1,
            total_earnings_usd: (affiliate.total_earnings_usd || 0) + commission,
            updated_at: new Date().toISOString()
          })
          .eq('id', affiliate.id);

        console.log(`✓ Affiliate commission recorded: $${commission.toFixed(2)}`);
      }
    }

    console.log('=== eSIM PROVISIONING RETRY COMPLETE ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'eSIM provisioned successfully',
        iccid: sim.iccid,
        sharing_link: sim.sharing?.link
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Retry failed:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
