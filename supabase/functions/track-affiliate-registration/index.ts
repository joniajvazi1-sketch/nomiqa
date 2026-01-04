import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const registrationSchema = z.object({
  referralCode: z.string().min(1).max(50),
  userId: z.string().uuid(),
  referrer: z.string().optional(),
});

// Detect traffic source from referrer
function detectSource(referrerUrl: string | null): string {
  if (!referrerUrl) return 'direct';
  
  const url = referrerUrl.toLowerCase();
  
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('t.co')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('pinterest.com')) return 'pinterest';
  if (url.includes('whatsapp.com')) return 'whatsapp';
  if (url.includes('telegram')) return 'telegram';
  if (url.includes('discord')) return 'discord';
  
  return 'other';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawBody = await req.json();
    const validationResult = registrationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { referralCode, userId, referrer } = validationResult.data;
    const source = detectSource(referrer || null);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Tracking registration for referral code: ${referralCode}, user: ${userId}`);

    // Find affiliate by code with username for the welcome email
    const { data: affiliate, error: affError } = await supabase
      .from('affiliates')
      .select('id, affiliate_code, total_registrations, username')
      .eq('affiliate_code', referralCode)
      .maybeSingle();

    if (affError) {
      console.error('Error finding affiliate:', affError);
      throw affError;
    }

    if (!affiliate) {
      console.log('Invalid referral code:', referralCode);
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the new user's email for sending welcome email
    const { data: newUserData } = await supabase.auth.admin.getUserById(userId);
    const newUserEmail = newUserData?.user?.email;

    // Check if this user already has a referral record
    const { data: existingReferral } = await supabase
      .from('affiliate_referrals')
      .select('id')
      .eq('registered_user_id', userId)
      .limit(1);

    if (existingReferral && existingReferral.length > 0) {
      console.log('User already has a referral record:', userId);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User already registered via referral',
          alreadyRegistered: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the referral record with 'registered' status
    const { error: insertError } = await supabase
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        visitor_id: userId,
        registered_user_id: userId,
        status: 'registered',
        source: source,
        commission_level: 1,
        clicked_at: new Date().toISOString(),
        registered_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting referral:', insertError);
      throw insertError;
    }

    // Update total registrations count
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({ 
        total_registrations: (affiliate.total_registrations || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('Error updating registration count:', updateError);
    }

    console.log(`Registration tracked successfully for affiliate ${affiliate.affiliate_code}`);
    
    // Send welcome email to the new referred user
    if (newUserEmail) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: 'referral_welcome',
            to: newUserEmail,
            data: {
              referrerUsername: affiliate.username || affiliate.affiliate_code,
            },
          }),
        });
        console.log(`Referral welcome email sent to ${newUserEmail}`);
      } catch (emailError) {
        console.error('Error sending referral welcome email:', emailError);
        // Don't fail the registration tracking if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Registration tracked successfully',
        affiliateCode: affiliate.affiliate_code
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error tracking registration:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});