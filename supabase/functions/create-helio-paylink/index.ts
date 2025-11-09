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
    const { orderId } = await req.json();

    console.log('Creating Helio paylink for order:', orderId);

    // Get env variables
    const helioPublicKey = Deno.env.get('HELIO_PUBLIC_API_KEY');
    const helioSecretKey = Deno.env.get('HELIO_SECRET_API_KEY');
    const helioWalletId = Deno.env.get('HELIO_WALLET_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!helioPublicKey || !helioSecretKey || !helioWalletId) {
      throw new Error('Missing Helio API credentials');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products:product_id(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      throw new Error('Order not found');
    }

    console.log('Order details:', { 
      id: order.id, 
      email: order.email, 
      total: order.total_amount_usd,
      product: order.products?.name 
    });

    // Get USDC currency ID from Helio
    const currenciesResponse = await fetch('https://api.hel.io/v1/currency', {
      headers: {
        'Authorization': `Bearer ${helioSecretKey}`,
      },
    });

    if (!currenciesResponse.ok) {
      throw new Error('Failed to fetch Helio currencies');
    }

    const currencies = await currenciesResponse.json();
    const usdcCurrency = currencies.find((c: any) => 
      c.symbol === 'USDC' && c.blockchain?.symbol === 'SOL'
    );

    if (!usdcCurrency) {
      throw new Error('USDC currency not found');
    }

    console.log('Using USDC currency:', usdcCurrency.id);

    // Convert USD to USDC base units (6 decimals)
    const priceInBaseUnits = Math.floor(parseFloat(order.total_amount_usd) * 1000000).toString();

    // Create paylink
    const paylinkData = {
      template: 'OTHER',
      name: `${order.products?.name || 'eSIM'} - Order ${order.id.substring(0, 8)}`,
      description: `eSIM purchase: ${order.package_name || order.products?.name}`,
      price: priceInBaseUnits,
      pricingCurrency: usdcCurrency.id,
      features: {
        requireEmail: true,
      },
      recipients: [
        {
          currencyId: usdcCurrency.id,
          walletId: helioWalletId,
        }
      ],
    };

    console.log('Creating paylink with data:', JSON.stringify(paylinkData, null, 2));

    const paylinkResponse = await fetch(
      `https://api.hel.io/v1/paylink/create/api-key?apiKey=${helioPublicKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${helioSecretKey}`,
        },
        body: JSON.stringify(paylinkData),
      }
    );

    if (!paylinkResponse.ok) {
      const errorText = await paylinkResponse.text();
      console.error('Helio API error:', errorText);
      throw new Error(`Failed to create paylink: ${errorText}`);
    }

    const paylink = await paylinkResponse.json();
    console.log('Paylink created:', paylink.id);

    // Store paylink ID in order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        airlo_request_id: paylink.id, // Reusing this field for Helio paylink ID
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with paylink ID:', updateError);
    }

    // Construct paylink URL (using slug if available)
    const paylinkUrl = `https://app.hel.io/pay/${paylink.id}`;

    return new Response(
      JSON.stringify({ 
        paylinkId: paylink.id,
        paylinkUrl,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-helio-paylink:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
