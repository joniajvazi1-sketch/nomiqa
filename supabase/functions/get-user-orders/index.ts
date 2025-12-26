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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Create client with service role for accessing orders_pii
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching orders for user: ${user.id}`);

    // Fetch orders for this authenticated user (non-PII data from orders table)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        product_id,
        status,
        total_amount_usd,
        validity_days,
        package_name,
        data_amount,
        visitor_id,
        referral_code,
        created_at,
        updated_at,
        products:product_id (
          country_name,
          country_code,
          name,
          data_amount,
          validity_days
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['completed', 'paid'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ orders: [], usage: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch PII data from orders_pii for these orders (service role bypasses RLS)
    const orderIds = orders.map(o => o.id);
    const { data: piiData, error: piiError } = await supabaseAdmin
      .from('orders_pii')
      .select('*')
      .in('id', orderIds);

    if (piiError) {
      console.error('Error fetching PII data:', piiError);
      // Continue without PII - better to show partial data than fail completely
    }

    // Create a map of PII data by order ID
    const piiMap: Record<string, any> = {};
    if (piiData) {
      piiData.forEach(pii => {
        piiMap[pii.id] = pii;
      });
    }

    // Fetch usage data for all orders
    const { data: usageData } = await supabaseAdmin
      .from('esim_usage')
      .select('order_id, remaining_mb, total_mb, status, expired_at')
      .in('order_id', orderIds);

    const usageMap: Record<string, any> = {};
    if (usageData) {
      usageData.forEach(usage => {
        usageMap[usage.order_id] = usage;
      });
    }

    // Merge orders with their PII data
    const enrichedOrders = orders.map(order => {
      const pii = piiMap[order.id] || {};
      const product = order.products as any;
      
      return {
        id: order.id,
        user_id: order.user_id,
        product_id: order.product_id,
        status: order.status,
        total_amount_usd: order.total_amount_usd,
        validity_days: order.validity_days,
        package_name: order.package_name,
        data_amount: order.data_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        // Add product info
        country_name: product?.country_name,
        country_code: product?.country_code,
        // Add PII data
        email: pii.email,
        full_name: pii.full_name,
        iccid: pii.iccid,
        lpa: pii.lpa,
        qrcode: pii.qrcode,
        qr_code_url: pii.qr_code_url,
        activation_code: pii.activation_code,
        matching_id: pii.matching_id,
        manual_installation: pii.manual_installation,
        qrcode_installation: pii.qrcode_installation,
        sharing_link: pii.sharing_link,
        sharing_access_code: pii.sharing_access_code,
      };
    });

    console.log(`Returning ${enrichedOrders.length} orders for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        orders: enrichedOrders, 
        usage: usageMap 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
