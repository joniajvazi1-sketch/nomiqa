import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // SECURITY: Always require both webhook secret and signature
    if (!webhookSecret) {
      logStep("STRIPE_WEBHOOK_SECRET is not configured - rejecting request");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!signature) {
      logStep("Missing stripe-signature header - rejecting request");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : err });
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Event type", { type: event.type });

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (!orderId) {
        logStep("No order_id in metadata");
        return new Response(
          JSON.stringify({ received: true, warning: "No order_id in metadata" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      logStep("Processing completed checkout", { orderId, sessionId: session.id });

      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if already processed (idempotency)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (existingOrder?.status === 'paid' || existingOrder?.status === 'completed') {
        logStep("Order already processed", { orderId, status: existingOrder.status });
        return new Response(
          JSON.stringify({ received: true, message: "Already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        logStep("Failed to update order", { error: updateError.message });
        throw new Error("Failed to update order status");
      }

      logStep("Order marked as paid", { orderId });

      // Trigger Airalo eSIM provisioning by calling the existing webhook-async-order function logic
      // The order is now paid, the async order webhook will provision the eSIM
      // For now, we'll invoke the eSIM provisioning inline

      // Get order details for provisioning
      const { data: order } = await supabase
        .from('orders')
        .select('*, products:product_id(*)')
        .eq('id', orderId)
        .single();

      if (order && order.products) {
        logStep("Triggering eSIM provisioning", { 
          orderId, 
          packageId: order.products.airlo_package_id 
        });

        // Get customer email from orders_pii
        const { data: pii } = await supabase
          .from('orders_pii')
          .select('email, full_name')
          .eq('id', orderId)
          .single();

        // Call Airalo to provision eSIM
        const airloEnv = Deno.env.get('AIRLO_ENV') || 'production';
        const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
        const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');

        if (airloClientId && airloClientSecret) {
          try {
            // Get Airalo access token
            const tokenUrl = airloEnv === 'sandbox' 
              ? 'https://sandbox-partners-api.airalo.com/v2/token'
              : 'https://partners-api.airalo.com/v2/token';

            const tokenResponse = await fetch(tokenUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: airloClientId,
                client_secret: airloClientSecret,
                grant_type: 'client_credentials',
              }),
            });

            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              const accessToken = tokenData.data?.access_token;

              // Create order in Airalo
              const orderUrl = airloEnv === 'sandbox'
                ? 'https://sandbox-partners-api.airalo.com/v2/orders-async'
                : 'https://partners-api.airalo.com/v2/orders-async';

              const airaloResponse = await fetch(orderUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  quantity: 1,
                  package_id: order.products.airlo_package_id,
                  type: 'sim',
                  description: `Stripe Order ${orderId}`,
                  webhook_url: `${supabaseUrl}/functions/v1/webhook-async-order`,
                }),
              });

              if (airaloResponse.ok) {
                const airaloData = await airaloResponse.json();
                logStep("Airalo order created", { requestId: airaloData.data?.request_id });

                // Update order with Airalo request ID
                await supabase
                  .from('orders')
                  .update({ 
                    airlo_order_id: airaloData.data?.request_id,
                    status: 'processing',
                  })
                  .eq('id', orderId);
              } else {
                const errorText = await airaloResponse.text();
                logStep("Airalo order failed", { error: errorText });
              }
            }
          } catch (airaloError) {
            logStep("Airalo provisioning error", { error: airaloError instanceof Error ? airaloError.message : airaloError });
          }
        } else {
          logStep("Airalo credentials not configured");
        }
      }

      // Log webhook for audit
      await supabase
        .from('webhook_logs')
        .insert({
          event_type: 'stripe_checkout_completed',
          payload: { session_id: session.id, order_id: orderId },
          processed: true,
        });
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
