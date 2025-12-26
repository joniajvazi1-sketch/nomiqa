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
    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user with anon client
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to fetch orders and PII
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's orders with product info
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, status, total_amount_usd, package_name, data_amount, validity_days,
        created_at, product_id, user_id, access_token, access_token_expires_at,
        access_token_invalidated, airlo_order_id,
        products:product_id (country_name, country_code)
      `)
      .eq('user_id', user.id)
      .in('status', ['completed', 'paid'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ orders: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch PII for all orders
    const orderIds = orders.map(o => o.id);
    const { data: piiData, error: piiError } = await supabase
      .from('orders_pii')
      .select('id, email, full_name, iccid, lpa, qrcode, qr_code_url, activation_code, matching_id, manual_installation, qrcode_installation, sharing_link, sharing_access_code')
      .in('id', orderIds);

    if (piiError) {
      console.error('PII fetch error:', piiError);
      // Don't fail completely, just return orders without PII
    }

    // Create PII lookup map
    const piiMap = new Map(piiData?.map(p => [p.id, p]) || []);

    // Merge PII into orders
    const ordersWithPii = orders.map(order => {
      const pii = piiMap.get(order.id);
      const products = order.products as any;
      
      return {
        ...order,
        // Merge PII fields
        email: pii?.email || 'see-orders-pii@private',
        full_name: pii?.full_name,
        iccid: pii?.iccid,
        lpa: pii?.lpa,
        qrcode: pii?.qrcode,
        qr_code_url: pii?.qr_code_url,
        activation_code: pii?.activation_code,
        matching_id: pii?.matching_id,
        manual_installation: pii?.manual_installation,
        qrcode_installation: pii?.qrcode_installation,
        sharing_link: pii?.sharing_link,
        sharing_access_code: pii?.sharing_access_code,
        // Flatten product data
        country_name: products?.country_name,
        country_code: products?.country_code,
        products: undefined
      };
    });

    console.log(`Returned ${ordersWithPii.length} orders for user ${user.id.substring(0, 8)}...`);

    return new Response(
      JSON.stringify({ orders: ordersWithPii }),
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
