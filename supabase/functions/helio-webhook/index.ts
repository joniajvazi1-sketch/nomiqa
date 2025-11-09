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

    const { event, transactionObject } = payload;

    // Only process CREATED events (successful payments)
    if (event !== 'CREATED') {
      console.log('Ignoring non-CREATED event:', event);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // TODO: Trigger eSIM provisioning here
    // This would involve calling the Airalo API to create the eSIM
    // Similar to the existing submit-order edge function

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
