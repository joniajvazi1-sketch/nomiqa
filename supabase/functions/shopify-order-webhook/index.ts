import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const orderSchema = z.object({
  // Customer info
  customer_email: z.string().email(),
  customer_name: z.string().optional(),
  
  // Order info from Shopify
  shopify_order_id: z.string().optional(),
  shopify_order_number: z.string().optional(),
  
  // Package info (all optional — Make may not send these)
  package_name: z.string().optional(),
  data_amount: z.string().optional(),
  validity_days: z.coerce.number().int().positive().optional(),
  price_usd: z.coerce.number().positive().optional(),
  country_name: z.string().optional(),
  country_code: z.string().optional(),
  
  // eSIM details from eSIM Access (all optional since delivery is via email)
  iccid: z.string().optional(),
  qrcode: z.string().optional(),
  qr_code_url: z.string().optional(),
  lpa: z.string().optional(),
  activation_code: z.string().optional(),
  matching_id: z.string().optional(),
  manual_installation: z.string().optional(),
  qrcode_installation: z.string().optional(),
  sharing_link: z.string().optional(),
  sharing_access_code: z.string().optional(),
  
  // Data capacity for usage tracking (provider sends bytes)
  total_bytes: z.coerce.number().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');

    if (!expectedSecret) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate body
    const rawBody = await req.json();
    const validation = orderSchema.safeParse(rawBody);

    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid payload', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = validation.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user_id by matching email to profiles
    let userId: string | null = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', data.customer_email.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (profile) {
      userId = profile.user_id;
      console.log(`Matched user ${userId} for email ${data.customer_email}`);
    } else {
      console.log(`No user found for email ${data.customer_email}, storing as guest order`);
    }

    // Find a matching product or use a placeholder
    let productId: string | null = null;
    if (data.country_code) {
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('country_code', data.country_code.toUpperCase())
        .eq('data_amount', data.data_amount)
        .limit(1)
        .maybeSingle();
      
      if (product) {
        productId = product.id;
      }
    }

    // If no product match, get any product as fallback (orders table requires product_id)
    if (!productId) {
      const { data: fallback } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      productId = fallback?.id || null;
    }

    if (!productId) {
      console.error('No products in database to reference');
      return new Response(
        JSON.stringify({ error: 'No products available in database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate access token for guest order link
    const accessToken = crypto.randomUUID();

    // Insert into orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        product_id: productId,
        email: 'see-orders-pii@private',
        status: 'completed',
        total_amount_usd: data.price_usd || 0,
        package_name: data.package_name || null,
        data_amount: data.data_amount || null,
        validity_days: data.validity_days || null,
        access_token: accessToken,
        referral_code: null,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw orderError;
    }

    console.log(`Created order ${order.id}`);

    // Insert into orders_pii table
    const { error: piiError } = await supabase
      .from('orders_pii')
      .insert({
        id: order.id,
        email: data.customer_email,
        full_name: data.customer_name || null,
        iccid: data.iccid || null,
        qrcode: data.qrcode || null,
        qr_code_url: data.qr_code_url || null,
        lpa: data.lpa || null,
        activation_code: data.activation_code || null,
        matching_id: data.matching_id || null,
        manual_installation: data.manual_installation || null,
        qrcode_installation: data.qrcode_installation || null,
        sharing_link: data.sharing_link || null,
        sharing_access_code: data.sharing_access_code || null,
      });

    if (piiError) {
      console.error('PII insert error:', piiError);
      // Don't fail entirely, order was already created
    }

    // Insert into esim_usage for tracking (if ICCID provided)
    if (data.iccid) {
      // Convert bytes to MB (provider sends bytes)
      const totalMb = data.total_bytes ? Math.round(data.total_bytes / 1024 / 1024) : null;
      
      const { error: usageError } = await supabase
        .from('esim_usage')
        .insert({
          iccid: data.iccid,
          order_id: order.id,
          total_mb: totalMb,
          remaining_mb: totalMb,
          status: 'NOT_ACTIVE',
        });

      if (usageError) {
        console.error('Usage insert error:', usageError);
      }
    }

    // Track affiliate commission if user was referred
    if (userId) {
      const { data: referral } = await supabase
        .from('affiliate_referrals')
        .select('id, affiliate_id')
        .eq('registered_user_id', userId)
        .eq('status', 'registered')
        .limit(1)
        .maybeSingle();

      if (referral) {
        await supabase
          .from('affiliate_referrals')
          .update({
            status: 'converted',
            converted_at: new Date().toISOString(),
            order_id: order.id,
            commission_amount_usd: (data.price_usd || 0) * 0.10,
            commission_level: 1,
          })
          .eq('id', referral.id);

        // Update affiliate stats
        await supabase
          .from('affiliates')
          .update({
            total_conversions: undefined, // Will be handled by trigger
            total_earnings_usd: undefined,
          })
          .eq('id', referral.affiliate_id);

        // Actually increment conversions
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('total_conversions, total_earnings_usd')
          .eq('id', referral.affiliate_id)
          .single();

        if (affiliate) {
          await supabase
            .from('affiliates')
            .update({
              total_conversions: (affiliate.total_conversions || 0) + 1,
              total_earnings_usd: (affiliate.total_earnings_usd || 0) + ((data.price_usd || 0) * 0.10),
            })
            .eq('id', referral.affiliate_id);
        }

        console.log(`Tracked commission for affiliate ${referral.affiliate_id}`);
      }
    }

    // Update user spending for membership tiers
    if (userId) {
      const { data: spending } = await supabase
        .from('user_spending')
        .select('total_spent_usd')
        .eq('user_id', userId)
        .maybeSingle();

      if (spending) {
        await supabase
          .from('user_spending')
          .update({
            total_spent_usd: (spending.total_spent_usd || 0) + (data.price_usd || 0),
            total_orders: undefined,
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_spending')
          .insert({
            user_id: userId,
            total_spent_usd: data.price_usd || 0,
            total_orders: 1,
          });
      }
    }

    // Log the webhook
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'shopify_order_received',
        payload: {
          order_id: order.id,
          shopify_order_id: data.shopify_order_id,
          customer_email_hash: data.customer_email.substring(0, 3) + '***',
          has_iccid: !!data.iccid,
          has_user: !!userId,
          price: data.price_usd || 0,
        },
        processed: true,
      });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        user_matched: !!userId,
        access_token: userId ? undefined : accessToken,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
