import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const invoiceSchema = z.object({
  orderId: z.string().uuid(),
  email: z.string().email().max(255),
  successUrl: z.string().url().max(500),
  cancelUrl: z.string().url().max(500)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawBody = await req.json();
    const validationResult = invoiceSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, email, successUrl, cancelUrl } = validationResult.data;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get order details using service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('user_id, email, total_amount_usd, package_name, data_amount, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns the order (either by user_id or email match)
    if (order.user_id !== user.id && order.email !== user.email) {
      console.error('Authorization failed: user does not own this order');
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify order is in pending_payment status
    if (order.status !== 'pending_payment') {
      console.error('Invalid order status:', order.status);
      return new Response(JSON.stringify({ error: 'Order is not in pending_payment status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating invoice for order:', orderId);

    // Create NowPayments invoice
    const nowpaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    const nowpaymentsResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': nowpaymentsApiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: order.total_amount_usd,
        price_currency: 'usd',
        pay_currency: 'solusd', // USDC on Solana
        order_id: orderId,
        order_description: `${order.package_name} - ${order.data_amount}`,
        ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    if (!nowpaymentsResponse.ok) {
      const errorText = await nowpaymentsResponse.text();
      console.error('NowPayments error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to create payment invoice' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const invoiceData = await nowpaymentsResponse.json();
    console.log('Invoice created:', invoiceData);

    return new Response(JSON.stringify({ 
      invoiceUrl: invoiceData.invoice_url,
      invoiceId: invoiceData.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-nowpayments-invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
