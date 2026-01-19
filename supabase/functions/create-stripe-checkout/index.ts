import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const checkoutSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(2).max(255),
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10).default(1),
  referralCode: z.string().max(50).nullable().optional(),
  visitorId: z.string().max(100).nullable().optional(),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    // SECURITY: Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify the user's JWT token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse and validate input
    const body = await req.json();
    const validationResult = checkoutSchema.safeParse(body);
    if (!validationResult.success) {
      logStep("Validation failed", { errors: validationResult.error.issues });
      return new Response(
        JSON.stringify({ error: "Invalid input data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, fullName, productId, quantity, referralCode, visitorId } = validationResult.data;

    // Initialize service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)
      .limit(10);

    if (recentOrders && recentOrders.length >= 10) {
      logStep("Rate limit exceeded", { userId: user.id });
      return new Response(
        JSON.stringify({ error: "Too many payment requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      logStep("Product not found", { productId, error: productError });
      throw new Error("Product not found");
    }

    logStep("Product found", { name: product.name, price: product.price_usd });

    const totalUsd = Number(product.price_usd) * quantity;

    // Create order in database
    const { data: order, error: createError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        email: 'see-orders-pii@private',
        product_id: product.id,
        package_name: product.name,
        data_amount: product.data_amount,
        validity_days: product.validity_days,
        total_amount_usd: totalUsd,
        status: 'pending_payment',
        visitor_id: visitorId || null,
        referral_code: referralCode || null,
      })
      .select()
      .single();

    if (createError || !order) {
      logStep("Order creation failed", { error: createError });
      throw new Error("Failed to create order");
    }

    logStep("Order created", { orderId: order.id });

    // Insert PII into secure table
    const { error: piiError } = await supabase
      .from('orders_pii')
      .insert({
        id: order.id,
        email: email,
        full_name: fullName
      });

    if (piiError) {
      logStep("PII insert warning", { error: piiError.message });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://nomiqa.lovable.app";

    // Create Stripe Checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${product.country_name} eSIM`,
              description: `${product.data_amount} • ${product.validity_days} days`,
            },
            unit_amount: Math.round(product.price_usd * 100), // Convert to cents
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${origin}/orders?paymentSuccess=true&orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        product_id: product.id,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          user_id: user.id,
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Store Stripe session ID in order (using airlo_request_id field)
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        airlo_request_id: `stripe_${session.id}`,
      })
      .eq('id', order.id);

    if (updateError) {
      logStep("Order update warning", { error: updateError.message });
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        orderId: order.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
