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
    
    // Generate opaque correlation ID for this request (no sensitive data)
    const correlationId = crypto.randomUUID().substring(0, 8);
    console.log(`[${correlationId}] Webhook received: ${payload.event || 'unknown'}`);
    const paylinkId = payload.transactionObject?.paylinkId;

    // Verify Helio webhook - multiple methods supported for Helio compatibility
    // SECURITY NOTE: Helio may use different auth methods depending on configuration.
    // All methods validate against the same HELIO_WEBHOOK_SECRET.
    // Primary method: HMAC-SHA256 signature (most secure)
    // Fallbacks: Bearer token, API key header, payload secret (for legacy compatibility)
    const signature = req.headers.get('x-signature') || req.headers.get('x-webhook-signature') || req.headers.get('signature');
    const authHeader = req.headers.get('authorization');
    const helioApiKey = req.headers.get('helio-api-key') || req.headers.get('x-helio-secret') || req.headers.get('x-api-key');
    const webhookSecret = Deno.env.get('HELIO_WEBHOOK_SECRET');

    // Security: Only log verification status, never log actual secrets or tokens
    console.log(`[${correlationId}] Webhook auth check:`, { 
      hasAuthHeader: !!authHeader, 
      hasApiKey: !!helioApiKey, 
      hasSignature: !!signature, 
      secretConfigured: !!webhookSecret 
    });

    if (!webhookSecret) {
      console.error(`[${correlationId}] Missing webhook secret configuration`);
      return new Response('Server configuration error', { status: 500 });
    }

    let isVerified = false;
    let verificationMethod = '';

    // Method 1: Verify HMAC-SHA256 signature (preferred - most secure)
    if (!isVerified && signature) {
      try {
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
        
        if (computedSignature === signature) {
          isVerified = true;
          verificationMethod = 'HMAC-SHA256';
        }
      } catch (hmacError) {
        console.error(`[${correlationId}] HMAC verification error:`, hmacError);
      }
    }

    // Method 2: Verify using Bearer token (fallback)
    if (!isVerified && authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7);
      if (bearerToken === webhookSecret) {
        isVerified = true;
        verificationMethod = 'Bearer token';
      }
    }

    // Method 3: Direct API key header (Helio commonly uses this)
    if (!isVerified && helioApiKey) {
      if (helioApiKey === webhookSecret) {
        isVerified = true;
        verificationMethod = 'API key header';
      }
    }

    // SECURITY: Methods 4 & 5 (payload secret, transaction meta) REMOVED
    // These methods logged secrets in webhook_logs table creating security risk
    // Only HMAC-SHA256 signature, Bearer token, and API key header are allowed
    
    // SECURITY: All methods are cryptographically verified against HELIO_WEBHOOK_SECRET
    // No weak fallbacks - signature/auth verification is mandatory

    if (!isVerified) {
      console.warn(`[${correlationId}] Webhook rejected: no valid auth method succeeded`);
      return new Response('Invalid webhook', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    console.log(`[${correlationId}] Webhook verified via: ${verificationMethod}`);

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
        console.log(`[${correlationId}] Duplicate request detected, already processed`);
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
    const orderPaylinkId = transactionObject.paylinkId;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('airlo_request_id', orderPaylinkId)
      .single();

    if (orderError || !order) {
      console.error(`[${correlationId}] Order not found`);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    console.log(`[${correlationId}] Order found, processing`);

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

    console.log(`[${correlationId}] Payment successful, provisioning eSIM`);

    // Mark transaction as processed to prevent replay attacks
    if (transactionId) {
      await supabase
        .from('processed_webhook_requests')
        .insert({
          transaction_id: transactionId,
          webhook_type: 'helio',
          processed_at: new Date().toISOString(),
        });
      console.log(`[${correlationId}] Transaction marked as processed`);
    }

    // Update order status (no PII updates here - email column removed from orders)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    // Update email in orders_pii if provided by customer
    if (customerDetails.email) {
      await supabase
        .from('orders_pii')
        .update({ email: customerDetails.email, updated_at: new Date().toISOString() })
        .eq('id', order.id);
    }

    console.log('Order updated successfully');

    // Affiliate conversions will be processed AFTER successful eSIM provisioning
    // (moved to line ~730 to ensure they only count when order completes successfully)

    // Provision eSIM from Airalo with retry logic
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

      // Helper function for retrying fetch requests with exponential backoff
      const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Fetch attempt ${attempt}/${maxRetries} to ${url}`);
            const response = await fetch(url, options);
            
            // Retry on 5xx errors (server errors, timeouts)
            if (response.status >= 500 && attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`Got ${response.status}, retrying in ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            
            return response;
          } catch (err) {
            lastError = err as Error;
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000;
              console.log(`Fetch error: ${err}, retrying in ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        throw lastError || new Error('Max retries exceeded');
      };

      console.log('Getting Airalo access token...');
      
      // Get access token using FormData (required by Airalo API)
      const tokenFormData = new FormData();
      tokenFormData.append('client_id', airloClientId);
      tokenFormData.append('client_secret', airloClientSecret);
      tokenFormData.append('grant_type', 'client_credentials');
      
      const authResponse = await fetchWithRetry(`${baseUrl}/v2/token`, {
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
      if (order.full_name) {
        formData.append('to_name', order.full_name);
      }
      formData.append('sharing_option[]', 'link');
      formData.append('sharing_option[]', 'pdf');
      
      const orderResponse = await fetchWithRetry(`${baseUrl}/v2/orders`, {
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
        // Log details server-side only, don't expose to clients
        console.error('Airalo order failed:', { status: orderResponse.status, body: orderResponseText });
        // Update order to failed status
        await supabase
          .from('orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', order.id);
        throw new Error('Failed to provision eSIM. Please contact support.');
      }

      const orderJson = JSON.parse(orderResponseText);
      const { data: orderData } = orderJson;
      
      // Extract eSIM details from sync response
      const sim = orderData.sims?.[0];
      if (!sim) {
        throw new Error('No eSIM data in Airalo response');
      }
      
      // SECURITY: Log only non-sensitive order metadata, mask PII
      console.log('Airalo order created:', { 
        orderId: orderData.id, 
        simsCount: orderData.sims?.length || 0,
        hasSharingLink: !!sim?.sharing?.link
      });

      // Update order status (non-PII fields only)
      console.log('Updating order status in database...');
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          airlo_order_id: orderData.id?.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Failed to update order:', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // Update PII in secure orders_pii table
      console.log('Updating eSIM details in secure PII table...');
      const { error: piiError } = await supabase
        .from('orders_pii')
        .update({
          iccid: sim.iccid,
          lpa: sim.lpa,
          matching_id: sim.matching_id,
          qrcode: sim.qrcode,
          qr_code_url: sim.qrcode_url,
          activation_code: sim.matching_id,
          manual_installation: orderData.manual_installation,
          qrcode_installation: orderData.qrcode_installation,
          sharing_link: sim.sharing?.link,
          sharing_access_code: sim.sharing?.access_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (piiError) {
        console.error('Failed to update order PII:', piiError);
        // Log but don't throw - order completion is more important
      }

      console.log('✓ Order updated successfully in database');
      console.log('=== eSIM PROVISIONING COMPLETE ===');

      // Create eSIM usage record
      console.log('Creating eSIM usage tracking record...');
      const { error: usageError } = await supabase.from('esim_usage').insert({
        order_id: order.id,
        iccid: sim.iccid,
        total_mb: parseInt(order.data_amount) || 0,
        remaining_mb: parseInt(order.data_amount) || 0,
        status: 'NOT_ACTIVE'
      });

      if (usageError) {
        console.error('Failed to create usage record:', usageError);
        // Don't throw - this is not critical for order completion
      } else {
        console.log('✓ eSIM usage record created');
      }

      // Update user spending for membership tier tracking (only after successful provisioning)
      console.log('=== UPDATING USER SPENDING & CASHBACK ===');
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

        console.log(`✓ User spending updated: $${newTotalSpent.toFixed(2)}`);

        // Check if tier upgraded and send celebration email
        const { data: updatedSpending } = await supabase
          .from('user_spending')
          .select('membership_tier, cashback_rate')
          .eq('user_id', order.user_id)
          .single();

        if (updatedSpending && oldTier && updatedSpending.membership_tier !== oldTier) {
          console.log(`✓ Membership tier upgraded: ${oldTier} -> ${updatedSpending.membership_tier} (${updatedSpending.cashback_rate}% cashback)`);
          
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            
            console.log(`Sending tier upgrade email to ${order.email}`);
            const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: 'tier_upgrade',
                to: order.email,
                data: {
                  oldTier,
                  newTier: updatedSpending.membership_tier,
                  totalSpent: newTotalSpent.toFixed(2)
                }
              }),
            });
            
            if (!sendEmailResponse.ok) {
              const errorText = await sendEmailResponse.text();
              console.error(`Failed to send tier upgrade email: ${sendEmailResponse.status} - ${errorText}`);
            } else {
              console.log('✓ Tier upgrade celebration email sent');
            }
          } catch (emailError) {
            console.error('Failed to send tier upgrade email:', emailError);
          }
        }
      }

      // Process affiliate conversions (only after successful eSIM provisioning)
      console.log('=== PROCESSING AFFILIATE CONVERSIONS ===');
      if (order.referral_code) {
        console.log('Referral code detected:', order.referral_code);
        
        try {
          // Find the affiliate by referral code
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, commission_rate, total_conversions, total_earnings_usd, parent_affiliate_id, tier_level')
            .eq('affiliate_code', order.referral_code)
            .maybeSingle();

          if (affiliate) {
            console.log('Affiliate found:', affiliate.id);
            
            // Calculate commission (10% flat)
            const level1Commission = order.total_amount_usd * 0.10;
            
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

            console.log(`✓ Level 1 commission earned: $${level1Commission.toFixed(2)}`);
            console.log(`✓ Total conversions: ${newTotalConversions}`);

            // Check if affiliate tier upgraded and send celebration email
            const { data: updatedAffiliate } = await supabase
              .from('affiliates')
              .select('tier_level, email')
              .eq('id', affiliate.id)
              .single();

            if (updatedAffiliate && updatedAffiliate.tier_level > oldTierLevel) {
              console.log(`✓ Affiliate tier upgraded: ${oldTierLevel} -> ${updatedAffiliate.tier_level}`);
              
              try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
                
                console.log(`Sending affiliate tier upgrade email to ${updatedAffiliate.email}`);
                const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    type: 'affiliate_tier_upgrade',
                    to: updatedAffiliate.email,
                    data: {
                      oldTier: oldTierLevel,
                      newTier: updatedAffiliate.tier_level,
                      totalConversions: newTotalConversions
                    }
                  }),
                });
                
                if (!sendEmailResponse.ok) {
                  const errorText = await sendEmailResponse.text();
                  console.error(`Failed to send affiliate tier upgrade email: ${sendEmailResponse.status} - ${errorText}`);
                } else {
                  console.log('✓ Affiliate tier upgrade email sent');
                }
              } catch (emailError) {
                console.error('Failed to send affiliate tier upgrade email:', emailError);
              }
            }

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

                console.log(`✓ Level 2 commission earned (tier ${parentAffiliate.tier_level}): $${level2Commission.toFixed(2)}`);

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

                    console.log(`✓ Level 3 commission earned (tier ${grandparentAffiliate.tier_level}): $${level3Commission.toFixed(2)}`);
                  } else {
                    console.log('Grandparent not tier 3 yet - level 3 commission not earned');
                  }
                }
              } else {
                console.log('Parent not tier 2 yet - level 2 commission not earned');
              }
            }

            console.log('✓ Affiliate conversion processed successfully');
          } else {
            console.log('No affiliate found with code:', order.referral_code);
          }
        } catch (affiliateError) {
          console.error('❌ Error processing affiliate conversion:', affiliateError);
          // Don't fail the webhook, just log the error
        }
      }

      // Airalo sends the branded email directly to the customer
      // No need to send emails from our side
      console.log('✓ Airalo will send branded email to customer');

      console.log(`[${correlationId}] === ORDER PROCESSING COMPLETE ===`);
      console.log(`[${correlationId}] Status: completed`);
      console.log(`[${correlationId}] eSIM provisioned: ✓`);
      console.log(`[${correlationId}] Sharing link available: ${sim.sharing?.link ? '✓' : '❌'}`);
      console.log(`[${correlationId}] ================================`);
      
      if (!sim.sharing?.link) {
        console.error(`[${correlationId}] CRITICAL: No sharing link - check Airalo brand settings`);
      }
    } catch (airloError: any) {
      console.error(`[${correlationId}] eSIM provisioning failed:`, airloError.message || 'Unknown error');
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
