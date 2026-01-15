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

  try {
    const payload = await req.text();
    const airaloSignature = req.headers.get('airalo-signature');
    
    console.log('Received Airalo webhook');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    console.log('Payload:', payload);
    console.log('Airalo Signature:', airaloSignature);
    
    // Verify HMAC signature (temporarily disabled for debugging)
    const apiSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const expectedSignature = createHmac('sha512', apiSecret!)
      .update(payload)
      .digest('hex');

    console.log('Expected Signature:', expectedSignature);

    // SECURITY: Enforce strict signature verification
    if (!airaloSignature) {
      console.error('Missing Airalo signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (airaloSignature !== expectedSignature) {
      console.error('Signature mismatch - rejecting webhook');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Airalo webhook signature verified successfully');

    const data = JSON.parse(payload);

    console.log('Parsed payload:', JSON.stringify(data, null, 2));

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
      console.error('Invalid webhook payload:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid payload structure', details: validationResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validation passed! Processing webhook...');

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

    console.log('Processing order with request_id:', data.request_id);

    // Find order by request_id
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('airlo_request_id', data.request_id)
      .single();

    if (!order) {
      console.error('Order not found:', airaloData.request_id);
      return new Response(
        JSON.stringify({ status: 'Order not found but acknowledged' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order found:', order.id);

    // Check for errors
    if (airaloData.reason && !airaloData.sims) {
      console.log('Order failed with reason:', airaloData.reason);
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
      
      console.log('Updating order with eSIM data, ICCID:', sim.iccid);
      
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
        console.error('Error updating order status:', orderUpdateError);
      } else {
        console.log('Order status updated to completed');
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
        console.error('Error updating orders_pii:', piiUpdateError);
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
          console.error('Error inserting orders_pii:', piiInsertError);
        } else {
          console.log('Created orders_pii record for order');
        }
      } else {
        console.log('orders_pii updated successfully with eSIM data');
      }

      console.log('Order updated successfully with eSIM data');

      // Create eSIM usage record
      console.log('Creating eSIM usage record');
      await supabase.from('esim_usage').insert({
        order_id: order.id,
        iccid: sim.iccid,
        total_mb: parseInt(order.data_amount) * 1024 || 0,
        remaining_mb: parseInt(order.data_amount) * 1024 || 0,
        status: 'NOT_ACTIVE'
      });

      console.log('eSIM usage record created successfully');

      // Update user spending for membership tier tracking (only if user is logged in)
      if (order.user_id) {
        console.log('Updating user spending for membership tier...');
        
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
          
          console.log(`Updated user spending: $${currentSpending.total_spent_usd} + $${order.total_amount_usd}`);
        } else {
          // Create new spending record
          await supabase
            .from('user_spending')
            .insert({
              user_id: order.user_id,
              total_spent_usd: order.total_amount_usd
            });
          
          console.log(`Created new user spending record: $${order.total_amount_usd}`);
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
          console.log('No valid customer email found in orders_pii, skipping email');
        } else {
          console.log('Sending order confirmation email to:', customerEmail);
          
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
            console.error('Failed to send order confirmation email:', emailResponse.error);
          } else {
            console.log('Order confirmation email sent successfully');
          }
        }
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
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
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Processing error' }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});