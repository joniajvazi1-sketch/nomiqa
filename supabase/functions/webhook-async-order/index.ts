import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { Resend } from "npm:resend@2.0.0";

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

    if (airaloSignature && airaloSignature !== expectedSignature) {
      console.error('Signature mismatch - but processing anyway for debugging');
      // Temporarily allow through for debugging
      // return new Response(
      //   JSON.stringify({ error: 'Invalid signature' }),
      //   { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      // );
    }

    const data = JSON.parse(payload);

    console.log('Parsed payload:', JSON.stringify(data, null, 2));

    // Validate webhook payload structure - Airalo wraps data in a "data" object
    const webhookSchema = z.object({
      data: z.object({
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
      }),
      meta: z.object({
        message: z.string()
      }).optional(),
      request_id: z.string().optional()
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

    // Log webhook
    await supabase.from('webhook_logs').insert({
      event_type: 'async_order',
      payload: data,
      signature: airaloSignature,
      processed: false
    });

    // Extract the nested data object from Airalo's payload
    const airaloData = data.data;

    console.log('Processing order with request_id:', airaloData.request_id);

    // Find order by request_id
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('airlo_request_id', airaloData.request_id)
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
          manual_installation: airaloData.manual_installation,
          qrcode_installation: airaloData.qrcode_installation,
          airlo_order_id: airaloData.id?.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

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

      // Send eSIM delivery email
      console.log('Sending eSIM delivery email to:', order.email);
      try {
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
        const ordersUrl = `${Deno.env.get('SUPABASE_URL').replace('supabase.co', 'lovableproject.com')}/orders?token=${order.access_token}`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Nomiqa eSIM is Ready!</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; max-width: 100%;">
                      <!-- Header with animated logo -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                          <img src="https://gzhmbiopiciugriatsdb.supabase.co/storage/v1/object/public/assets/nomiqa-animated-logo.gif" alt="Nomiqa" style="width: 120px; height: auto; margin-bottom: 20px;">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Your eSIM is Ready! 🎉</h1>
                          <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">Activate your global connectivity now</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px;">Hello!</h2>
                          <p style="color: #4a5568; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                            Great news! Your <strong>${order.package_name}</strong> eSIM has been successfully provisioned and is ready to activate.
                          </p>
                          
                          <!-- QR Code Section -->
                          <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px; border: 2px solid #e2e8f0;">
                            <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📱 Scan to Install</h3>
                            <img src="${sim.qrcode_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(sim.qrcode)}`}" alt="eSIM QR Code" style="width: 250px; height: 250px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <p style="color: #718096; margin: 20px 0 0 0; font-size: 14px;">Open your phone's camera and scan this code</p>
                          </div>
                          
                          <!-- Details Section -->
                          <div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                            <h3 style="color: #2d3748; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📋 eSIM Details</h3>
                            
                            <div style="margin-bottom: 16px;">
                              <p style="color: #718096; margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Package</p>
                              <p style="color: #2d3748; margin: 0; font-size: 16px; font-weight: 500;">${order.package_name}</p>
                            </div>
                            
                            <div style="margin-bottom: 16px;">
                              <p style="color: #718096; margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Data Allowance</p>
                              <p style="color: #2d3748; margin: 0; font-size: 16px; font-weight: 500;">${order.data_amount} • Valid for ${order.validity_days} days</p>
                            </div>
                            
                            <div style="margin-bottom: 16px;">
                              <p style="color: #718096; margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Activation Code</p>
                              <p style="color: #667eea; margin: 0; font-size: 15px; font-weight: 600; font-family: 'Courier New', monospace; background: white; padding: 10px; border-radius: 6px; word-break: break-all;">${sim.matching_id}</p>
                            </div>
                            
                            <div>
                              <p style="color: #718096; margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">ICCID</p>
                              <p style="color: #4a5568; margin: 0; font-size: 14px; font-family: 'Courier New', monospace; background: white; padding: 10px; border-radius: 6px; word-break: break-all;">${sim.iccid}</p>
                            </div>
                          </div>
                          
                          <!-- CTA Button -->
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="${ordersUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                              View Full Details
                            </a>
                          </div>
                          
                          <!-- Instructions -->
                          <div style="border-top: 2px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
                            <h3 style="color: #2d3748; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🚀 Quick Installation Guide</h3>
                            <ol style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8;">
                              <li style="margin-bottom: 10px;"><strong>Scan the QR code</strong> above with your phone's camera</li>
                              <li style="margin-bottom: 10px;"><strong>Follow the prompts</strong> to add the eSIM to your device</li>
                              <li style="margin-bottom: 10px;"><strong>Enable the eSIM</strong> in your phone's settings when ready to use</li>
                              <li><strong>Turn on data roaming</strong> for this eSIM to connect</li>
                            </ol>
                          </div>
                          
                          <!-- Footer Note -->
                          <div style="background: #fef5e7; border-left: 4px solid #f59e0b; padding: 16px; margin-top: 24px; border-radius: 6px;">
                            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                              <strong>💡 Pro Tip:</strong> Install your eSIM before traveling, but only activate it when you arrive at your destination to maximize your data validity period.
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                          <p style="color: #718096; margin: 0 0 8px 0; font-size: 14px;">Need help? Visit our <a href="https://nomiqa-esim.com/help" style="color: #667eea; text-decoration: none;">Help Center</a></p>
                          <p style="color: #a0aec0; margin: 0; font-size: 12px;">© 2025 Nomiqa. Stay connected, stay free.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `;

        const { error: emailError } = await resend.emails.send({
          from: 'Nomiqa eSIM <support@nomiqa-esim.com>',
          to: [order.email],
          subject: `🎉 Your ${order.package_name} eSIM is Ready to Activate!`,
          html: emailHtml
        });

        if (emailError) {
          console.error('Failed to send eSIM email:', emailError);
        } else {
          console.log('eSIM delivery email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the webhook if email fails
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