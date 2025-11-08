import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
};

const webhookSchema = z.object({
  order_id: z.string().uuid(),
  payment_status: z.enum(['finished', 'confirmed', 'failed', 'expired', 'pending', 'waiting', 'sending', 'partially_paid', 'refunded']),
  payment_id: z.string().optional(),
  price_amount: z.number().positive().optional(),
  price_currency: z.string().max(10).optional(),
  pay_amount: z.number().positive().optional(),
  actually_paid: z.number().positive().optional(),
  pay_currency: z.string().max(10).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.text();
    const signature = req.headers.get('x-nowpayments-sig');
    
    console.log('Received webhook:', payload);

    // Verify webhook signature
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
    if (ipnSecret && signature) {
      const sortedPayload = sortObjectKeys(JSON.parse(payload));
      const expectedSignature = createHmac('sha512', ipnSecret)
        .update(JSON.stringify(sortedPayload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const webhookData = JSON.parse(payload);
    
    // Validate webhook payload structure
    const validationResult = webhookSchema.safeParse(webhookData);
    if (!validationResult.success) {
      console.error('Invalid webhook payload:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid payload', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id: orderId, payment_status: paymentStatus } = validationResult.data;

    console.log('Payment status for order', orderId, ':', paymentStatus);

    // Update order status based on payment status
    if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
      // Payment successful - provision eSIM
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) {
        console.error('Order not found:', orderId);
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Call Airalo API to provision eSIM
      const airaloClientId = Deno.env.get('AIRLO_CLIENT_ID');
      const airaloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
      const airaloEnv = Deno.env.get('AIRLO_ENV') || 'production';
      const airaloBaseUrl = airaloEnv === 'production' 
        ? 'https://api.airalo.com' 
        : 'https://sandbox-partners-api.airalo.com';

      // Get Airalo access token
      const tokenResponse = await fetch(`${airaloBaseUrl}/v2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: airaloClientId,
          client_secret: airaloClientSecret,
          grant_type: 'client_credentials',
        }),
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.data.access_token;

      // Create eSIM order
      const orderResponse = await fetch(`${airaloBaseUrl}/v2/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: 1,
          package_id: order.airlo_package_id || order.package_name,
          type: 'sim',
          description: `Order ${orderId}`,
        }),
      });

      const orderData = await orderResponse.json();
      console.log('Airalo order response:', orderData);

      if (orderData.data && orderData.data.sims && orderData.data.sims[0]) {
        const sim = orderData.data.sims[0];
        
        // Update order with eSIM details
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            iccid: sim.iccid,
            qrcode: sim.qrcode_url || sim.qrcode,
            lpa: sim.lpa_code || sim.lpa,
            manual_installation: sim.manual_code || sim.manual_installation,
            qrcode_installation: sim.qrcode_url || sim.qrcode,
            activation_code: sim.activation_code,
            airlo_order_id: orderData.data.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        // Track affiliate conversion using proper visitor_id matching (fixes SQL injection)
        if (order.visitor_id) {
          const { data: referral } = await supabase
            .from('affiliate_referrals')
            .select('id, affiliate_id')
            .eq('visitor_id', order.visitor_id)
            .eq('status', 'pending')
            .is('order_id', null)
            .order('clicked_at', { ascending: false })
            .maybeSingle();

          if (referral && order.total_amount_usd) {
            const totalPrice = order.total_amount_usd;
            const commissionRates = [0.09, 0.06, 0.03]; // Level 1: 9%, Level 2: 6%, Level 3: 3%
            
            // Calculate commission (9% for level 1)
            const commissionAmount = totalPrice * commissionRates[0];

            // Update referral as converted
            await supabase
              .from('affiliate_referrals')
              .update({
                status: 'converted',
                order_id: orderId,
                commission_amount_usd: commissionAmount,
                converted_at: new Date().toISOString(),
              })
              .eq('id', referral.id);

            // Get level 1 affiliate details
            const { data: level1Aff } = await supabase
              .from('affiliates')
              .select('id, total_earnings_usd, total_conversions, parent_affiliate_id')
              .eq('id', referral.affiliate_id)
              .single();

            if (level1Aff) {
              // Update level 1 affiliate earnings
              await supabase
                .from('affiliates')
                .update({
                  total_conversions: (level1Aff.total_conversions || 0) + 1,
                  total_earnings_usd: (level1Aff.total_earnings_usd || 0) + commissionAmount,
                })
                .eq('id', referral.affiliate_id);

              // Handle level 2 and 3 commissions
              let currentAffiliateId = level1Aff.parent_affiliate_id;
              let level = 2;

              while (currentAffiliateId && level <= 3) {
                const commission = totalPrice * commissionRates[level - 1];

                // Create referral record for this level
                await supabase
                  .from('affiliate_referrals')
                  .insert({
                    affiliate_id: currentAffiliateId,
                    visitor_id: order.visitor_id,
                    order_id: orderId,
                    status: 'converted',
                    converted_at: new Date().toISOString(),
                    commission_amount_usd: commission,
                    commission_level: level
                  });

                // Update affiliate earnings
                const { data: currentAff } = await supabase
                  .from('affiliates')
                  .select('total_earnings_usd, total_conversions, parent_affiliate_id')
                  .eq('id', currentAffiliateId)
                  .single();

                if (currentAff) {
                  await supabase
                    .from('affiliates')
                    .update({
                      total_earnings_usd: (currentAff.total_earnings_usd || 0) + commission,
                      total_conversions: (currentAff.total_conversions || 0) + 1
                    })
                    .eq('id', currentAffiliateId);

                  currentAffiliateId = currentAff.parent_affiliate_id;
                } else {
                  break;
                }

                level++;
              }

              console.log(`Affiliate conversion tracked for order ${orderId}`);
            }
          }
        }

        console.log('Order completed successfully:', orderId);
      } else {
        console.error('Failed to provision eSIM:', orderData);
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    } else if (paymentStatus === 'failed' || paymentStatus === 'expired') {
      // Payment failed
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in nowpayments-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to sort object keys recursively
function sortObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  
  return Object.keys(obj)
    .sort()
    .reduce((result: any, key) => {
      result[key] = sortObjectKeys(obj[key]);
      return result;
    }, {});
}
