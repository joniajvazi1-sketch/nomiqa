import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const paylinkSchema = z.object({
  orderId: z.string().uuid().optional(),
  email: z.string().email().max(255).optional(),
  fullName: z.string().min(2).max(255).optional(),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(10).default(1).optional(),
  referralCode: z.string().max(50).nullable().optional(),
  visitorId: z.string().max(100).nullable().optional(),
  // userId is now ignored - we use authenticated user ID
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Require authentication for paylink creation
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user's JWT token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use authenticated user ID - ignore any client-provided userId
    const authenticatedUserId = user.id;
    console.log('Authenticated user:', authenticatedUserId);

    const body = await req.json();
    
    // Validate input
    const validationResult = paylinkSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const validatedData = validationResult.data;
    let orderId = validatedData.orderId;

    // Initialize service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting by authenticated user ID (much harder to bypass than email/visitorId)
    if (!orderId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', authenticatedUserId)
        .gte('created_at', oneHourAgo)
        .limit(10);

      if (recentOrders && recentOrders.length >= 10) {
        console.log(`Rate limit exceeded for user ${authenticatedUserId}`);
        return new Response(
          JSON.stringify({ error: 'Too many payment requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Creating Helio paylink for user:', authenticatedUserId);

    // Get Helio env variables
    const helioPublicKey = Deno.env.get('HELIO_PUBLIC_API_KEY');
    const helioSecretKey = Deno.env.get('HELIO_SECRET_API_KEY');
    const helioWalletId = Deno.env.get('HELIO_WALLET_ID');

    if (!helioPublicKey || !helioSecretKey || !helioWalletId) {
      throw new Error('Missing Helio API credentials');
    }

    let order: any = null;

    if (orderId) {
      console.log('Using existing orderId:', orderId);
      // Get order details - verify it belongs to authenticated user
      const { data: existingOrder, error: orderError } = await supabase
        .from('orders')
        .select('*, products:product_id(*)')
        .eq('id', orderId)
        .eq('user_id', authenticatedUserId) // SECURITY: Only allow access to own orders
        .single();

      if (orderError || !existingOrder) {
        console.error('Error fetching order:', orderError);
        throw new Error('Order not found');
      }
      order = existingOrder;
    } else {
      // Create order on the server (bypasses client RLS)
      const { email, fullName, productId, quantity = 1, referralCode = null, visitorId = null } = validatedData;
      if (!email || !productId) {
        throw new Error('Missing email or productId');
      }

      // Fetch product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('Error fetching product:', productError);
        throw new Error('Product not found');
      }

      const totalUsd = Number(product.price_usd) * Number(quantity);

      // Create order (non-PII fields only) - SECURITY: Use authenticated user ID
      const { data: createdOrder, error: createError } = await supabase
        .from('orders')
        .insert({
          user_id: authenticatedUserId, // SECURITY: Always use authenticated user ID
          email: 'see-orders-pii@private', // Placeholder - real email in orders_pii
          product_id: product.id,
          package_name: product.name,
          data_amount: product.data_amount,
          validity_days: product.validity_days,
          total_amount_usd: totalUsd,
          status: 'pending_payment',
          visitor_id: visitorId,
          referral_code: referralCode,
        })
        .select('*, products:product_id(*)')
        .single();

      if (createError || !createdOrder) {
        console.error('Error creating order:', createError);
        throw new Error('Failed to create order');
      }

      // Insert PII into secure orders_pii table
      const { error: piiError } = await supabase
        .from('orders_pii')
        .insert({
          id: createdOrder.id,
          email: email,
          full_name: fullName || 'Customer'
        });

      if (piiError) {
        console.error('Error inserting order PII:', piiError);
        // Don't fail the order creation, just log the error
      }

      order = createdOrder;
      // Add email back to order object for response/logging
      order.email = email;
      orderId = createdOrder.id;
      console.log('Created order on server:', orderId);
    }

    console.log('Order details:', { 
      id: order.id, 
      email: order.email, 
      total: order.total_amount_usd,
      product: order.products?.name 
    });

    // Get USDC and SOL currency IDs from Helio
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
    const solCurrency = currencies.find((c: any) => 
      c.symbol === 'SOL' && c.blockchain?.symbol === 'SOL'
    );

    if (!usdcCurrency || !solCurrency) {
      throw new Error('USDC or SOL currency not found');
    }

    console.log('Using currencies:', { usdc: usdcCurrency.id, sol: solCurrency.id });

    // Convert USD to USDC base units (6 decimals)
    const priceInBaseUnits = Math.floor(parseFloat(order.total_amount_usd) * 1000000).toString();

    // Create paylink with country name in title
    const productName = order.products?.name || order.package_name || 'eSIM';
    const countryName = order.products?.country_name || '';
    const paylinkTitle = countryName ? `${countryName} - ${productName}` : productName;
    
    // Configure webhook URL for payment completion callback
    const webhookUrl = `${supabaseUrl}/functions/v1/helio-webhook`;
    
    // Get the origin from the request or use a default
    const origin = req.headers.get('origin') || 'https://nomiqa-depin.com';
    
    // Success URL redirects directly to My eSIMs page (orders) after payment
    // This is critical for Phantom wallet flow where user leaves app and returns
    const successUrl = `${origin}/orders?paymentSuccess=true&orderId=${orderId}`;
    const cancelUrl = `${origin}/checkout?cancelled=true`;
    
    const paylinkData = {
      template: 'OTHER',
      name: paylinkTitle,
      description: `eSIM purchase for ${countryName} - ${productName}`,
      price: priceInBaseUnits,
      pricingCurrency: usdcCurrency.id,
      features: {
        requireEmail: true,
      },
      recipients: [
        {
          currencyId: usdcCurrency.id,
          walletId: helioWalletId,
        },
        {
          currencyId: solCurrency.id,
          walletId: helioWalletId,
        }
      ],
      webhookUrl: webhookUrl,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
    };
    
    console.log('Webhook URL configured:', webhookUrl);

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

    // Construct paylink URL with showPayWithCard=false to hide card payment option (crypto-only)
    const paylinkUrl = `https://app.hel.io/pay/${paylink.id}?showPayWithCard=false`;

    return new Response(
      JSON.stringify({ 
        paylinkId: paylink.id,
        paylinkUrl,
        orderId: orderId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    // Log full error server-side only
    console.error('Error in create-helio-paylink:', error instanceof Error ? { message: error.message, stack: error.stack } : error);
    // Return generic error to client - never expose internal details
    return new Response(
      JSON.stringify({ error: 'Failed to create payment link. Please try again or contact support.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
