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
    // Parse webhook payload first
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));
    console.log('Webhook headers:', Object.fromEntries(req.headers.entries()));

    // Verify MoonPay Commerce webhook signature
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('signature');
    const webhookSecret = Deno.env.get('HELIO_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('Missing webhook secret configuration');
      return new Response('Server configuration error', { status: 500 });
    }

    // Verify HMAC-SHA256 signature if present
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(rawBody)
      );
      
      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (computedSignature !== signature) {
        console.error('Invalid webhook signature');
        console.error('Expected:', signature);
        console.error('Computed:', computedSignature);
        return new Response('Invalid signature', { status: 401 });
      }
      
      console.log('Webhook signature verified successfully');
    } else {
      console.warn('No signature provided - processing anyway for debugging');
    }

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

    // Process affiliate conversion if referral code exists
    if (order.referral_code || order.visitor_id) {
      try {
        console.log('Processing affiliate conversion...');
        
        // Find the affiliate by referral code
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id, commission_rate, total_conversions, total_earnings_usd, parent_affiliate_id, tier_level')
          .eq('affiliate_code', order.referral_code)
          .maybeSingle();

        if (affiliate) {
          // Calculate commission (9% for level 1)
          const level1Commission = order.total_amount_usd * 0.09;
          
          // Find the referral click record - match by visitor_id OR user_id
          const { data: referral } = await supabase
            .from('affiliate_referrals')
            .select('id, status')
            .eq('affiliate_id', affiliate.id)
            .or(`visitor_id.eq.${order.visitor_id}${order.user_id ? `,visitor_id.eq.${order.user_id}` : ''}`)
            .eq('status', 'pending')
            .order('clicked_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Update or create referral record
          if (referral) {
            await supabase
              .from('affiliate_referrals')
              .update({
                status: 'converted',
                order_id: order.id,
                commission_amount_usd: level1Commission,
                commission_level: 1,
                converted_at: new Date().toISOString()
              })
              .eq('id', referral.id);
          } else {
            // Create new referral record if click wasn't tracked
            await supabase
              .from('affiliate_referrals')
              .insert({
                affiliate_id: affiliate.id,
                visitor_id: order.user_id || order.visitor_id || order.email,
                order_id: order.id,
                status: 'converted',
                commission_amount_usd: level1Commission,
                commission_level: 1,
                source: 'direct',
                clicked_at: new Date().toISOString(),
                converted_at: new Date().toISOString()
              });
          }

            // Update affiliate stats
            const { data: currentAffiliate } = await supabase
              .from('affiliates')
              .select('total_conversions, total_earnings_usd, tier_level, email')
              .eq('id', affiliate.id)
              .single();

            const oldTierLevel = currentAffiliate?.tier_level || 1;
            const newTotalConversions = (currentAffiliate?.total_conversions || 0) + 1;

            await supabase
              .from('affiliates')
              .update({
                total_conversions: newTotalConversions,
                total_earnings_usd: (currentAffiliate?.total_earnings_usd || 0) + level1Commission,
                updated_at: new Date().toISOString()
              })
              .eq('id', affiliate.id);

            // Check if affiliate tier upgraded and send celebration email
            const { data: updatedAffiliate } = await supabase
              .from('affiliates')
              .select('tier_level, email')
              .eq('id', affiliate.id)
              .single();

            if (updatedAffiliate && updatedAffiliate.tier_level > oldTierLevel) {
              console.log(`Affiliate tier upgraded: ${oldTierLevel} -> ${updatedAffiliate.tier_level}`);
              
              try {
                await supabase.functions.invoke('send-email', {
                  body: {
                    type: 'affiliate_tier_upgrade',
                    to: updatedAffiliate.email,
                    data: {
                      oldTier: oldTierLevel,
                      newTier: updatedAffiliate.tier_level,
                      totalConversions: newTotalConversions
                    }
                  }
                });
                console.log('Affiliate tier upgrade celebration email sent');
              } catch (emailError) {
                console.error('Failed to send affiliate tier upgrade email:', emailError);
              }
            }

            console.log(`Level 1 commission: $${level1Commission.toFixed(2)}`);

          // Process level 2 commission if there's a parent AND they've unlocked tier 2
          if (affiliate.parent_affiliate_id) {
            const { data: parentAffiliate } = await supabase
              .from('affiliates')
              .select('id, total_conversions, total_earnings_usd, parent_affiliate_id, tier_level')
              .eq('id', affiliate.parent_affiliate_id)
              .maybeSingle();

            // Only give level 2 commission if parent has tier 2 or higher (10+ conversions)
            if (parentAffiliate && parentAffiliate.tier_level >= 2) {
              const level2Commission = order.total_amount_usd * 0.06;
              
              await supabase
                .from('affiliate_referrals')
                .insert({
                  affiliate_id: parentAffiliate.id,
                  visitor_id: order.user_id || order.visitor_id || order.email,
                  order_id: order.id,
                  status: 'converted',
                  commission_amount_usd: level2Commission,
                  commission_level: 2,
                  source: 'level2',
                  clicked_at: new Date().toISOString(),
                  converted_at: new Date().toISOString()
                });

              await supabase
                .from('affiliates')
                .update({
                  total_earnings_usd: (parentAffiliate.total_earnings_usd || 0) + level2Commission,
                  updated_at: new Date().toISOString()
                })
                .eq('id', parentAffiliate.id);

              console.log(`Level 2 commission (tier ${parentAffiliate.tier_level}): $${level2Commission.toFixed(2)}`);

              // Process level 3 commission if grandparent exists AND they've unlocked tier 3
              if (parentAffiliate.parent_affiliate_id) {
                const { data: grandparentAffiliate } = await supabase
                  .from('affiliates')
                  .select('id, total_conversions, total_earnings_usd, tier_level')
                  .eq('id', parentAffiliate.parent_affiliate_id)
                  .maybeSingle();

                // Only give level 3 commission if grandparent has tier 3 (30+ conversions)
                if (grandparentAffiliate && grandparentAffiliate.tier_level >= 3) {
                  const level3Commission = order.total_amount_usd * 0.03;
                  
                  await supabase
                    .from('affiliate_referrals')
                    .insert({
                      affiliate_id: grandparentAffiliate.id,
                      visitor_id: order.user_id || order.visitor_id || order.email,
                      order_id: order.id,
                      status: 'converted',
                      commission_amount_usd: level3Commission,
                      commission_level: 3,
                      source: 'level3',
                      clicked_at: new Date().toISOString(),
                      converted_at: new Date().toISOString()
                    });

                  await supabase
                    .from('affiliates')
                    .update({
                      total_earnings_usd: (grandparentAffiliate.total_earnings_usd || 0) + level3Commission,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', grandparentAffiliate.id);

                  console.log(`Level 3 commission (tier ${grandparentAffiliate.tier_level}): $${level3Commission.toFixed(2)}`);
                } else if (grandparentAffiliate) {
                  console.log(`Level 3 commission NOT earned - grandparent is tier ${grandparentAffiliate.tier_level}, needs tier 3`);
                }
              }
            } else if (parentAffiliate) {
              console.log(`Level 2 commission NOT earned - parent is tier ${parentAffiliate.tier_level}, needs tier 2 or higher`);
            }
          }

          console.log('Affiliate conversion processed successfully');
        }
      } catch (affiliateError) {
        console.error('Error processing affiliate conversion:', affiliateError);
        // Don't fail the webhook, just log the error
      }
    }

    // Provision eSIM from Airalo
    try {
      const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
      const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
      const airloEnv = Deno.env.get('AIRLO_ENV') || 'sandbox';
      
      if (!airloClientId || !airloClientSecret) {
        throw new Error('Missing Airalo API credentials');
      }
      
      const baseUrl = airloEnv === 'production' 
        ? 'https://partners-api.airalo.com'
        : 'https://sandbox-partners-api.airalo.com';

      console.log('Getting Airalo access token...');
      
      // Get access token using FormData (required by Airalo API)
      const tokenFormData = new FormData();
      tokenFormData.append('client_id', airloClientId);
      tokenFormData.append('client_secret', airloClientSecret);
      tokenFormData.append('grant_type', 'client_credentials');
      
      const authResponse = await fetch(`${baseUrl}/v2/token`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: tokenFormData
      });

      const authResponseText = await authResponse.text();
      console.log('Auth response status:', authResponse.status);
      console.log('Auth response body:', authResponseText);

      if (!authResponse.ok) {
        throw new Error(`Failed to authenticate with Airalo: ${authResponse.status} - ${authResponseText}`);
      }

      const authJson = JSON.parse(authResponseText);
      const { data: authData } = authJson;
      const accessToken = authData.access_token;

      console.log('Submitting eSIM order to Airalo...');

      // Get product details to get the package_id
      const { data: product } = await supabase
        .from('products')
        .select('airlo_package_id')
        .eq('id', order.product_id)
        .maybeSingle();

      if (!product || !product.airlo_package_id) {
        throw new Error('Product not found or missing Airalo package ID');
      }

      // Submit sync order to Airalo with brand settings using FormData
      console.log('Submitting order with brand settings: Nomiqa');
      
      const formData = new FormData();
      formData.append('package_id', product.airlo_package_id);
      formData.append('quantity', '1');
      formData.append('type', 'sim');
      formData.append('description', `Order ${order.id} for ${order.email}`);
      formData.append('brand_settings_name', 'Nomiqa');
      formData.append('to_email', order.email);
      formData.append('sharing_option[]', 'link');  // Form data format with []
      
      const orderResponse = await fetch(`${baseUrl}/v2/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
          // FormData sets Content-Type automatically with boundary
        },
        body: formData
      });

      const orderResponseText = await orderResponse.text();
      console.log('Order response status:', orderResponse.status);
      console.log('Order response body:', orderResponseText);

      if (!orderResponse.ok) {
        console.error('Airalo order failed:', orderResponseText);
        throw new Error(`Airalo order failed: ${orderResponse.status} - ${orderResponseText}`);
      }

      const orderJson = JSON.parse(orderResponseText);
      const { data: orderData } = orderJson;
      
      console.log('Airalo response:', JSON.stringify(orderData, null, 2));
      console.log('Sharing object:', orderData.sharing);
      console.log('Sharing link:', orderData.sharing?.link);
      console.log('Access code:', orderData.sharing?.access_code);

      // Extract eSIM details from sync response
      const sim = orderData.sims?.[0];
      if (!sim) {
        throw new Error('No eSIM data in Airalo response');
      }

      // Update order with complete eSIM details and branded sharing info
      console.log('Updating order in database...');
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          airlo_order_id: orderData.id?.toString(),
          iccid: sim.iccid,
          lpa: sim.lpa,
          matching_id: sim.matching_id,
          qrcode: sim.qrcode,
          qr_code_url: sim.qrcode_url,
          activation_code: sim.matching_id,
          manual_installation: orderData.manual_installation,
          qrcode_installation: orderData.qrcode_installation,
          sharing_link: orderData.sharing?.link,
          sharing_access_code: orderData.sharing?.access_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      console.log('✓ Order updated successfully in database');
      console.log('=== eSIM PROVISIONING COMPLETE ===');

      // Create eSIM usage record
      console.log('Creating eSIM usage tracking record...');
      const { error: usageError } = await supabase.from('esim_usage').insert({
        order_id: order.id,
        iccid: sim.iccid,
        total_mb: parseInt(order.data_amount) * 1024 || 0,
        remaining_mb: parseInt(order.data_amount) * 1024 || 0,
        status: 'NOT_ACTIVE'
      });

      if (usageError) {
        console.error('Failed to create usage record:', usageError);
        // Don't throw - this is not critical for order completion
      } else {
        console.log('✓ eSIM usage record created');
      }

      // Update user spending for membership tier tracking
      if (order.user_id) {
        const { data: currentSpending } = await supabase
          .from('user_spending')
          .select('total_spent_usd, membership_tier')
          .eq('user_id', order.user_id)
          .maybeSingle();

        const oldTier = currentSpending?.membership_tier;
        const newTotalSpent = (currentSpending?.total_spent_usd || 0) + order.total_amount_usd;

        if (currentSpending) {
          await supabase
            .from('user_spending')
            .update({
              total_spent_usd: newTotalSpent,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', order.user_id);
        } else {
          await supabase
            .from('user_spending')
            .insert({
              user_id: order.user_id,
              total_spent_usd: order.total_amount_usd
            });
        }

        // Check if tier upgraded and send celebration email
        const { data: updatedSpending } = await supabase
          .from('user_spending')
          .select('membership_tier')
          .eq('user_id', order.user_id)
          .single();

        if (updatedSpending && oldTier && updatedSpending.membership_tier !== oldTier) {
          console.log(`Membership tier upgraded: ${oldTier} -> ${updatedSpending.membership_tier}`);
          
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                type: 'tier_upgrade',
                to: order.email,
                data: {
                  oldTier,
                  newTier: updatedSpending.membership_tier,
                  totalSpent: newTotalSpent.toFixed(2)
                }
              }
            });
            console.log('Tier upgrade celebration email sent');
          } catch (emailError) {
            console.error('Failed to send tier upgrade email:', emailError);
          }
        }
      }

      // Airalo sends the branded email directly to the customer
      // No need to send emails from our side
      console.log('✓ Airalo will send branded email to customer');

      console.log('=== ORDER PROCESSING COMPLETE ===');
      console.log('Order ID:', order.id);
      console.log('Status: completed');
      console.log('eSIM provisioned: ✓');
      console.log('Database updated: ✓');
      console.log('Airalo branded email: ✓ (sent by Airalo)');
      console.log('Sharing link:', orderData.sharing?.link ? '✓ Available' : '❌ Missing');
      console.log('Access code:', orderData.sharing?.access_code ? '✓ Available' : '❌ Missing');
      console.log('================================');
      
      // Log critical warning if sharing link is missing
      if (!orderData.sharing?.link) {
        console.error('⚠️ CRITICAL: No sharing link in Airalo response - customer cannot access eSIM portal!');
        console.error('Check Airalo Partner Dashboard brand settings configuration for "nomiqa"');
      }
    } catch (airloError: any) {
      console.error('=== ❌ ESIM PROVISIONING FAILED ===');
      console.error('Order ID:', order.id);
      console.error('Error:', airloError.message || airloError);
      console.error('Stack:', airloError.stack);
      console.error('===================================');
      // Don't fail the webhook, just log the error
      // The order is already marked as paid but will remain in failed state
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
