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

// Points awarded for referral signup
const REFERRAL_BONUS_POINTS = 100;

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

// Calculate mining boost based on total registrations
function calculateMiningBoost(totalRegistrations: number): { level: number; boost: number } {
  if (totalRegistrations >= 100) return { level: 5, boost: 100 };
  if (totalRegistrations >= 50) return { level: 4, boost: 70 };
  if (totalRegistrations >= 30) return { level: 3, boost: 40 };
  if (totalRegistrations >= 15) return { level: 2, boost: 20 };
  if (totalRegistrations >= 5) return { level: 1, boost: 10 };
  return { level: 0, boost: 0 };
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
      .select('id, affiliate_code, total_registrations, username, user_id, miner_boost_percentage, registration_milestone_level')
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

    // Calculate new registration count and mining boost
    const newTotalRegistrations = (affiliate.total_registrations || 0) + 1;
    const { level: newLevel, boost: newBoost } = calculateMiningBoost(newTotalRegistrations);

    // Update total registrations count and mining boost for the referrer's affiliate record
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({ 
        total_registrations: newTotalRegistrations,
        registration_milestone_level: newLevel,
        miner_boost_percentage: newBoost,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('Error updating registration count:', updateError);
    }

    // Award 100 points to the REFERRER (the person who invited)
    if (affiliate.user_id) {
      const { data: referrerPoints } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', affiliate.user_id)
        .maybeSingle();

      if (referrerPoints) {
        // Update existing points record
        await supabase
          .from('user_points')
          .update({
            total_points: (referrerPoints.total_points || 0) + REFERRAL_BONUS_POINTS,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', affiliate.user_id);
      } else {
        // Create new points record for referrer
        await supabase
          .from('user_points')
          .insert({
            user_id: affiliate.user_id,
            total_points: REFERRAL_BONUS_POINTS,
            pending_points: 0
          });
      }
      console.log(`Awarded ${REFERRAL_BONUS_POINTS} points to referrer ${affiliate.user_id}`);
    }

    // Award 100 points to the NEW USER (the person who got invited)
    const { data: newUserPoints } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', userId)
      .maybeSingle();

    if (newUserPoints) {
      // Update existing points record
      await supabase
        .from('user_points')
        .update({
          total_points: (newUserPoints.total_points || 0) + REFERRAL_BONUS_POINTS,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new points record for new user
      await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: REFERRAL_BONUS_POINTS,
          pending_points: 0
        });
    }
    console.log(`Awarded ${REFERRAL_BONUS_POINTS} points to new user ${userId}`);

    console.log(`Registration tracked successfully for affiliate ${affiliate.affiliate_code}, new boost: ${newBoost}%`);
    
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
              bonusPoints: REFERRAL_BONUS_POINTS,
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
        affiliateCode: affiliate.affiliate_code,
        pointsAwarded: REFERRAL_BONUS_POINTS,
        newMiningBoost: newBoost
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
