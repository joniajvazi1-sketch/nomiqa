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
    
    // Verify HMAC signature
    const apiSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const expectedSignature = createHmac('sha512', apiSecret!)
      .update(payload)
      .digest('hex');

    if (airaloSignature !== expectedSignature) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = JSON.parse(payload);

    // Validate webhook payload structure
    const webhookSchema = z.object({
      request_id: z.string(),
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
    });

    const validationResult = webhookSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Invalid webhook payload:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid payload structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log webhook
    await supabase.from('webhook_logs').insert({
      event_type: 'async_order',
      payload: data,
      signature: airaloSignature,
      processed: false
    });

    // Find order by request_id
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('airlo_request_id', data.request_id)
      .single();

    if (!order) {
      console.error('Order not found:', data.request_id);
      return new Response(
        JSON.stringify({ status: 'Order not found but acknowledged' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for errors
    if (data.reason && !data.sims) {
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
    if (data.sims && data.sims.length > 0) {
      const sim = data.sims[0];
      
      await supabase
        .from('orders')
        .update({
          status: 'completed',
          iccid: sim.iccid,
          lpa: sim.lpa,
          matching_id: sim.matching_id,
          qrcode: sim.qrcode,
          qr_code_url: sim.qrcode_url,
          activation_code: sim.matching_id,
          manual_installation: data.manual_installation,
          qrcode_installation: data.qrcode_installation,
          airlo_order_id: data.id?.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      // Create eSIM usage record
      await supabase.from('esim_usage').insert({
        order_id: order.id,
        iccid: sim.iccid,
        total_mb: parseInt(order.data_amount) * 1024 || 0,
        remaining_mb: parseInt(order.data_amount) * 1024 || 0,
        status: 'NOT_ACTIVE'
      });
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