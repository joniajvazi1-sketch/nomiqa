import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
};

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
    const orderId = webhookData.order_id;
    const paymentStatus = webhookData.payment_status;

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
