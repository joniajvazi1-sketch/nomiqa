import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const clickSchema = z.object({
  referralCode: z.string().min(1).max(50).optional(),
  username: z.string().min(1).max(50).optional(),
  userId: z.string().optional(),
}).refine(data => data.referralCode || data.username, {
  message: "Either referralCode or username must be provided"
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawBody = await req.json();
    const validationResult = clickSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { referralCode, username, userId } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find affiliate by code or username
    let affiliate;
    if (username) {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, affiliate_code, total_clicks')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      
      if (error) throw error;
      affiliate = data;
    } else if (referralCode) {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, affiliate_code, total_clicks')
        .eq('affiliate_code', referralCode)
        .maybeSingle();
      
      if (error) throw error;
      affiliate = data;
    }

    if (!affiliate) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code or username' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get visitor identifier (user ID if available, otherwise IP)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const visitorId = userId || clientIP;

    // Rate limiting: Check if this visitor clicked this affiliate in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentClicks } = await supabase
      .from('affiliate_referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('visitor_id', visitorId)
      .gte('clicked_at', oneHourAgo)
      .limit(1);

    if (recentClicks && recentClicks.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Click already recorded recently',
          rateLimited: true,
          affiliateCode: affiliate.affiliate_code 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record the click
    const { error: insertError } = await supabase
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        visitor_id: visitorId,
        status: 'pending',
        clicked_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting referral:', insertError);
      throw insertError;
    }

    // Update total clicks count
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({ 
        total_clicks: (affiliate.total_clicks || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('Error updating click count:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Click tracked successfully',
        affiliateCode: affiliate.affiliate_code
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error tracking click:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});