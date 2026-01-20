import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, airalo-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate correlation ID for tracking (no sensitive data)
  const correlationId = crypto.randomUUID().substring(0, 8);

  try {
    const payload = await req.text();
    const airaloSignature = req.headers.get('airalo-signature');
    const requestTimestamp = req.headers.get('x-airalo-timestamp') || req.headers.get('timestamp');
    
    // SECURITY: Log only non-sensitive metadata
    console.log(`[${correlationId}] Webhook received: Airalo async order`);
    console.log(`[${correlationId}] Auth check:`, { 
      hasSignature: !!airaloSignature,
      hasTimestamp: !!requestTimestamp
    });
    
    const apiSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    if (!apiSecret) {
      console.error(`[${correlationId}] Missing API secret configuration`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expectedSignature = createHmac('sha512', apiSecret)
      .update(payload)
      .digest('hex');

    // SECURITY: Enforce strict signature verification
    if (!airaloSignature) {
      console.error(`[${correlationId}] Missing signature header - rejecting`);
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (airaloSignature !== expectedSignature) {
      console.error(`[${correlationId}] Signature mismatch - rejecting`);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${correlationId}] Signature verified`);

    const data = JSON.parse(payload);

    // SECURITY: Timestamp validation to prevent replay attacks
    // Check if payload contains a timestamp (Airalo may include in data or headers)
    const payloadTimestamp = data.timestamp || data.created_at || requestTimestamp;
    if (payloadTimestamp) {
      const requestTime = new Date(payloadTimestamp).getTime();
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes window
      
      if (isNaN(requestTime) || Math.abs(now - requestTime) > maxAge) {
        console.error(`[${correlationId}] Request timestamp outside valid window`);
        return new Response(
          JSON.stringify({ error: 'Request expired' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // SECURITY: Log only structure info, not full payload
    console.log(`[${correlationId}] Payload received: request_id=${data.request_id || 'none'}`);

    // Validate webhook payload structure - Airalo sends request_id at root level
    const webhookSchema = z.object({
      request_id: z.string(), // At root level, not inside data
      data: z.object({
        reason: z.string().optional(),
        sims: z.array(z.object({
          iccid: z.string(),
          lpa: z.string().optional(),
          matching_id: z.string().optional(),
          qrcode: z.string().optional(),
          qrcode_url: z.string().optional()
        })).optional(),
        manual_installation: z.string().optional(),
        qrcode_installation: z.string().optional(),
        id: z.union([z.string(), z.number()]).optional()
      }),
      meta: z.object({
        message: z.string()
      }).optional()
    });

    const validationResult = webhookSchema.safeParse(data);
    if (!validationResult.success) {
      // SECURITY: Log validation failure type only, not full error details
      console.error(`[${correlationId}] Invalid webhook payload structure`);
      return new Response(
        JSON.stringify({ error: 'Invalid payload structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${correlationId}] Validation passed, processing...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log webhook - SECURITY: Redact any secrets from payload before logging
    const safePayload = { ...data };
    if (safePayload.secret) safePayload.secret = '[REDACTED]';
    if (safePayload.api_secret) safePayload.api_secret = '[REDACTED]';
    if (safePayload.apiSecret) safePayload.apiSecret = '[REDACTED]';
    if (safePayload.transactionObject?.meta?.apiSecret) {
      safePayload.transactionObject = { 
        ...safePayload.transactionObject, 
        meta: { ...safePayload.transactionObject.meta, apiSecret: '[REDACTED]' } 
      };
    }
    
    await supabase.from('webhook_logs').insert({
      event_type: 'async_order',
      payload: safePayload,
      signature: airaloSignature ? '[SIGNATURE_PRESENT]' : null, // Don't log actual signature
      processed: false
    });

    // Extract the nested data object from Airalo's payload
    const airaloData = data.data;

    console.log(`[${correlationId}] Processing order lookup`);

    // Find order by request_id
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('airlo_request_id', data.request_id)
      .single();

    if (!order) {
      console.error(`[${correlationId}] Order not found`);
      return new Response(
        JSON.stringify({ status: 'Order not found but acknowledged' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${correlationId}] Order found, processing`);

    // Check for errors
    if (airaloData.reason && !airaloData.sims) {
      console.log(`[${correlationId}] Order failed with reason`);
      // Log error type but not the specific reason which may contain sensitive info
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ status: 'processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with eSIM details
    if (airaloData.sims && airaloData.sims.length > 0) {
      const sim = airaloData.sims[0];
      
      // SECURITY: Log processing status, not PII like ICCID
      console.log(`[${correlationId}] Updating order with eSIM data`);
      
      // Update non-PII fields in orders table (PII columns were removed)
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          airlo_order_id: airaloData.id?.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderUpdateError) {
        // SECURITY: Log error occurrence, not the full error object
        console.error(`[${correlationId}] Error updating order status`);
      } else {
        console.log(`[${correlationId}] Order status updated to completed`);
      }

      // Store PII in orders_pii table (secure storage)
      const { error: piiUpdateError } = await supabase
        .from('orders_pii')
        .update({
          iccid: sim.iccid,
          lpa: sim.lpa,
          matching_id: sim.matching_id,
          qrcode: sim.qrcode,
          qr_code_url: sim.qrcode_url,
          activation_code: sim.matching_id,
          manual_installation: airaloData.manual_installation,
          qrcode_installation: airaloData.qrcode_installation,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (piiUpdateError) {
        // SECURITY: Log error occurrence, not full error details
        console.error(`[${correlationId}] Error updating orders_pii`);
        // Try insert if update fails (in case PII record doesn't exist yet)
        const { error: piiInsertError } = await supabase
          .from('orders_pii')
          .insert({
            id: order.id,
            email: 'see-orders-pii@private', // Placeholder, actual email stored at creation
            iccid: sim.iccid,
            lpa: sim.lpa,
            matching_id: sim.matching_id,
            qrcode: sim.qrcode,
            qr_code_url: sim.qrcode_url,
            activation_code: sim.matching_id,
            manual_installation: airaloData.manual_installation,
            qrcode_installation: airaloData.qrcode_installation
          });
        
        if (piiInsertError) {
          console.error(`[${correlationId}] Error inserting orders_pii`);
        } else {
          console.log(`[${correlationId}] Created orders_pii record`);
        }
      } else {
        console.log(`[${correlationId}] orders_pii updated`);
      }

      console.log(`[${correlationId}] Order updated with eSIM data`);

      // Create eSIM usage record
      console.log(`[${correlationId}] Creating eSIM usage record`);
      await supabase.from('esim_usage').insert({
        order_id: order.id,
        iccid: sim.iccid,
        total_mb: parseInt(order.data_amount) * 1024 || 0,
        remaining_mb: parseInt(order.data_amount) * 1024 || 0,
        status: 'NOT_ACTIVE'
      });

      console.log(`[${correlationId}] eSIM usage record created`);

      // Update user spending for membership tier tracking (only if user is logged in)
      if (order.user_id) {
        console.log(`[${correlationId}] Updating user spending`);
        
        // Get current spending or create new record
        const { data: currentSpending } = await supabase
          .from('user_spending')
          .select('total_spent_usd')
          .eq('user_id', order.user_id)
          .maybeSingle();

        if (currentSpending) {
          // Update existing spending record
          await supabase
            .from('user_spending')
            .update({
              total_spent_usd: currentSpending.total_spent_usd + order.total_amount_usd,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', order.user_id);
          
          console.log(`[${correlationId}] User spending updated`);
        } else {
          // Create new spending record
          await supabase
            .from('user_spending')
            .insert({
              user_id: order.user_id,
              total_spent_usd: order.total_amount_usd
            });
          
          console.log(`[${correlationId}] New user spending record created`);
        }
      }

      // Send order confirmation email with eSIM Cloud portal link
      try {
        // Fetch PII (email, sharing links) from orders_pii table
        const { data: orderPii } = await supabase
          .from('orders_pii')
          .select('email, sharing_link, sharing_access_code')
          .eq('id', order.id)
          .single();
        
        const customerEmail = orderPii?.email;
        
        if (!customerEmail || customerEmail === 'see-orders-pii@private') {
          console.log(`[${correlationId}] No valid customer email, skipping`);
        } else {
          // SECURITY: Don't log email addresses
          console.log(`[${correlationId}] Sending order confirmation email`);
          
          const { data: product } = await supabase
            .from('products')
            .select('country_name')
            .eq('id', order.product_id)
            .single();

          const emailResponse = await supabase.functions.invoke('send-email', {
            body: {
              type: 'order_confirmation',
              to: customerEmail,
              data: {
                country: product?.country_name || 'Unknown',
                dataAmount: order.data_amount,
                validity: order.validity_days,
                price: order.total_amount_usd.toFixed(2),
                sharingLink: orderPii?.sharing_link,
                accessCode: orderPii?.sharing_access_code
              }
            }
          });

          if (emailResponse.error) {
            // SECURITY: Log failure occurrence only
            console.error(`[${correlationId}] Failed to send confirmation email`);
          } else {
            console.log(`[${correlationId}] Order confirmation email sent`);
          }
        }
      } catch (emailError) {
        // SECURITY: Log error type only, not full error
        console.error(`[${correlationId}] Email sending error occurred`);
        // Don't fail the webhook, just log the error
      }
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('payload->request_id', data.request_id);

    return new Response(
      JSON.stringify({ status: 'processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // SECURITY: Log error type only, no details that could aid attackers
    console.error(`Webhook processing error occurred`);
    return new Response(
      JSON.stringify({ error: 'Processing error' }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});