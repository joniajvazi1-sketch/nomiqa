import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const submitOrderSchema = z.object({
  packageId: z.string().max(100),
  email: z.string().email().max(255),
  userId: z.string().uuid().nullable().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawBody = await req.json();
    const validationResult = submitOrderSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { packageId, email, userId } = validationResult.data;

    const airloClientId = Deno.env.get('AIRLO_CLIENT_ID');
    const airloClientSecret = Deno.env.get('AIRLO_CLIENT_SECRET');
    const airloEnv = Deno.env.get('AIRLO_ENV') || 'sandbox';
    
    const baseUrl = airloEnv === 'production' 
      ? 'https://partners-api.airalo.com'
      : 'https://sandbox-partners-api.airalo.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: airloClientId,
        client_secret: airloClientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Airlo');
    }

    const { data: authData } = await authResponse.json();
    const accessToken = authData.access_token;

    // Submit sync order with email delivery and branding
    const orderResponse = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        package_id: packageId,
        quantity: 1,
        type: 'sim',
        description: `Order for ${email}`,
        brand_settings_name: 'nomiqa',
        to_email: email,
        sharing_option: ['link']
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(`Airlo order failed: ${JSON.stringify(errorData)}`);
    }

    const { data: orderData } = await orderResponse.json();
    
    // Sync orders return eSIM data immediately
    const esimData = orderData.sims?.[0];
    
    // Get sharing link and access code for branded eSIM Cloud portal
    const sharingData = orderData.sharing;
    
    // Get product details
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('airlo_package_id', packageId)
      .single();

    // Create order record with eSIM details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId || null,
        product_id: product?.id,
        email,
        total_amount_usd: product?.price_usd || 0,
        status: 'completed',
        airlo_order_id: orderData.id?.toString(),
        iccid: esimData?.iccid,
        lpa: esimData?.lpa,
        matching_id: esimData?.matching_id,
        qrcode: esimData?.qrcode,
        qr_code_url: esimData?.qrcode_url,
        activation_code: esimData?.matching_id,
        manual_installation: orderData.manual_installation,
        qrcode_installation: orderData.qrcode_installation,
        package_name: product?.name,
        data_amount: product?.data_amount,
        validity_days: product?.validity_days,
        sharing_link: sharingData?.link,
        sharing_access_code: sharingData?.access_code
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Handle multi-level affiliate commissions
    // Get the most recent referral for this order's visitor
    const { data: referrals } = await supabase
      .from('affiliate_referrals')
      .select('affiliate_id')
      .is('order_id', null)
      .order('clicked_at', { ascending: false })
      .limit(1);

    if (referrals && referrals.length > 0 && product?.price_usd) {
      const referral = referrals[0];
      const totalPrice = product.price_usd;
      // Get commission rates from environment variables with fallback defaults
      const commissionRates = [
        parseFloat(Deno.env.get('COMMISSION_LEVEL_1') || '0.09'), // Level 1: 9%
        parseFloat(Deno.env.get('COMMISSION_LEVEL_2') || '0.06'), // Level 2: 6%
        parseFloat(Deno.env.get('COMMISSION_LEVEL_3') || '0.03')  // Level 3: 3%
      ];
      
      // Update the referral with order_id and mark as converted
      await supabase
        .from('affiliate_referrals')
        .update({
          order_id: order.id,
          status: 'converted',
          converted_at: new Date().toISOString(),
          commission_amount_usd: totalPrice * commissionRates[0],
          commission_level: 1
        })
        .eq('affiliate_id', referral.affiliate_id)
        .is('order_id', null);

      // Get level 1 affiliate details
      const { data: level1Aff } = await supabase
        .from('affiliates')
        .select('id, total_earnings_usd, total_conversions, parent_affiliate_id')
        .eq('id', referral.affiliate_id)
        .single();

      if (level1Aff) {
        // Update level 1 affiliate earnings
        const level1Commission = totalPrice * commissionRates[0];
        await supabase
          .from('affiliates')
          .update({
            total_earnings_usd: (level1Aff.total_earnings_usd || 0) + level1Commission,
            total_conversions: (level1Aff.total_conversions || 0) + 1
          })
          .eq('id', level1Aff.id);

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
              order_id: order.id,
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
      }
    }

    // Create eSIM usage record if we have ICCID
    if (esimData?.iccid) {
      await supabase
        .from('esim_usage')
        .insert({
          iccid: esimData.iccid,
          order_id: order.id,
          status: 'NOT_ACTIVE',
          total_mb: null,
          remaining_mb: null
        });
    }

    // Update user spending for membership tier tracking
    if (userId && product?.price_usd) {
      const { data: existingSpending } = await supabase
        .from('user_spending')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingSpending) {
        await supabase
          .from('user_spending')
          .update({
            total_spent_usd: existingSpending.total_spent_usd + product.price_usd
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_spending')
          .insert({
            user_id: userId,
            total_spent_usd: product.price_usd
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});