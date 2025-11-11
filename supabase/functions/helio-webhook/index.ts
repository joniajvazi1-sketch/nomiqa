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
    // Verify webhook signature
    const authHeader = req.headers.get('authorization');
    const webhookSecret = Deno.env.get('HELIO_WEBHOOK_SECRET');

    if (!authHeader || !webhookSecret) {
      console.error('Missing authorization header or webhook secret');
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '');
    
    if (token !== webhookSecret) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    console.log('Webhook signature verified');

    // Parse webhook payload
    const payload = await req.json();
    console.log('Received Helio webhook:', JSON.stringify(payload, null, 2));

    // Initialize Supabase client early for replay protection
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Replay attack protection: Check for timestamp
    const requestTimestamp = payload.transactionObject?.meta?.timestamp || payload.timestamp;
    if (requestTimestamp) {
      const requestTime = new Date(requestTimestamp).getTime();
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes

      if (Math.abs(now - requestTime) > maxAge) {
        console.error('Request timestamp too old or in future:', {
          requestTime: new Date(requestTime).toISOString(),
          now: new Date(now).toISOString(),
          ageDiff: Math.abs(now - requestTime) / 1000 / 60 + ' minutes'
        });
        return new Response('Request expired or timestamp invalid', { status: 401 });
      }
    }

    // Replay attack protection: Check if transaction was already processed
    const transactionId = payload.transactionObject?.id || payload.transactionObject?.meta?.transactionSignature;
    if (transactionId) {
      const { data: existingRequest } = await supabase
        .from('processed_webhook_requests')
        .select('id')
        .eq('transaction_id', transactionId)
        .eq('webhook_type', 'helio')
        .single();

      if (existingRequest) {
        console.log('Duplicate request detected, transaction already processed:', transactionId);
        return new Response(
          JSON.stringify({ received: true, status: 'already_processed' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    const { event, transactionObject } = payload;

    // Only process CREATED events (successful payments)
    if (event !== 'CREATED') {
      console.log('Ignoring non-CREATED event:', event);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find order by paylink ID (stored in airlo_request_id)
    const paylinkId = transactionObject.paylinkId;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('airlo_request_id', paylinkId)
      .single();

    if (orderError || !order) {
      console.error('Order not found for paylink:', paylinkId, orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    console.log('Found order:', order.id);

    // Check transaction status
    const transactionStatus = transactionObject.meta?.transactionStatus;
    
    if (transactionStatus !== 'SUCCESS') {
      console.log('Transaction not successful:', transactionStatus);
      
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract customer details
    const customerDetails = transactionObject.meta?.customerDetails || {};
    const transactionSignature = transactionObject.meta?.transactionSignature;

    console.log('Payment successful for order:', order.id);
    console.log('Transaction signature:', transactionSignature);

    // Mark transaction as processed to prevent replay attacks
    if (transactionId) {
      await supabase
        .from('processed_webhook_requests')
        .insert({
          transaction_id: transactionId,
          webhook_type: 'helio',
          processed_at: new Date().toISOString(),
        });
      console.log('Marked transaction as processed:', transactionId);
    }

    // Update order with payment details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        email: customerDetails.email || order.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log('Order updated successfully');

    // Provision eSIM from Airalo
    try {
      const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
      const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
      const airloEnv = Deno.env.get('AIRLO_ENV') || 'sandbox';
      
      const baseUrl = airloEnv === 'production' 
        ? 'https://partners-api.airalo.com'
        : 'https://sandbox-partners-api.airalo.com';

      console.log('Getting Airalo access token...');
      
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
        throw new Error('Failed to authenticate with Airalo');
      }

      const { data: authData } = await authResponse.json();
      const accessToken = authData.access_token;

      console.log('Submitting eSIM order to Airalo...');

      // Get product details to get the package_id
      const { data: product } = await supabase
        .from('products')
        .select('airlo_package_id')
        .eq('id', order.product_id)
        .single();

      if (!product || !product.airlo_package_id) {
        throw new Error('Product not found or missing Airalo package ID');
      }

      // Submit async order to Airalo
      const orderResponse = await fetch(`${baseUrl}/v2/orders-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          package_id: product.airlo_package_id,
          quantity: 1,
          type: 'sim',
          description: `Order ${order.id} for ${order.email}`
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(`Airalo order failed: ${JSON.stringify(errorData)}`);
      }

      const { data: orderData } = await orderResponse.json();
      
      console.log('Airalo order submitted:', orderData.request_id);

      // Update order with Airalo request ID
      await supabase
        .from('orders')
        .update({
          airlo_request_id: orderData.request_id,
        })
        .eq('id', order.id);

      console.log('eSIM provisioning initiated successfully');
    } catch (airloError) {
      console.error('Error provisioning eSIM from Airalo:', airloError);
      // Don't fail the webhook, just log the error
      // The order is already marked as paid
    }

    return new Response(
      JSON.stringify({ 
        received: true, 
        orderId: order.id,
        status: 'processed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing Helio webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
