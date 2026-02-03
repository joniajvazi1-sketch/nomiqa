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

// Points awarded immediately on signup (reduced from 50)
const IMMEDIATE_SIGNUP_BONUS = 20;
// Points awarded after first contribution (activity-gated)
const ACTIVITY_GATED_BONUS = 30;
// Total still equals 50, but split between immediate and activity-gated
const REFERRAL_BONUS_POINTS = IMMEDIATE_SIGNUP_BONUS + ACTIVITY_GATED_BONUS;

// Max referrals per 24 hours (velocity limit)
const VELOCITY_THRESHOLD_24H = 10;
// Max referrals per affiliate (lifetime cap)
const MAX_REFERRALS_DEFAULT = 100;

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
    // SECURITY: Verify internal call - this endpoint should only be called by other edge functions
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('apikey');
    const expectedServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!expectedServiceKey) {
      console.error('[track-affiliate-registration] Missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Allow service role key (from other edge functions) 
    const isServiceCall = 
      (authHeader && authHeader === `Bearer ${expectedServiceKey}`) ||
      (apiKey && apiKey === expectedServiceKey);
    
    if (!isServiceCall) {
      console.warn('[track-affiliate-registration] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - internal endpoint only' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      .select('id, affiliate_code, total_registrations, username, user_id, miner_boost_percentage, registration_milestone_level, max_referrals')
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

    // ==========================================================
    // SAFEGUARD 1: Check referral cap (max referrals per affiliate)
    // ==========================================================
    const maxReferrals = affiliate.max_referrals || MAX_REFERRALS_DEFAULT;
    if ((affiliate.total_registrations || 0) >= maxReferrals) {
      console.log(`Affiliate ${affiliate.affiliate_code} has reached referral cap: ${affiliate.total_registrations}/${maxReferrals}`);
      // Still allow registration but don't award points
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration recorded but referral cap reached',
          referralCapReached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================================
    // SAFEGUARD 2: Check 24h velocity (rate limiting)
    // ==========================================================
    const { count: recentReferralsCount } = await supabase
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id)
      .gte('registered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const velocity24h = recentReferralsCount || 0;
    if (velocity24h >= VELOCITY_THRESHOLD_24H) {
      console.warn(`Velocity limit exceeded for affiliate ${affiliate.affiliate_code}: ${velocity24h} referrals in 24h`);
      // Log to security audit
      await supabase.from('security_audit_log').insert({
        user_id: affiliate.user_id,
        event_type: 'referral_velocity_exceeded',
        severity: 'warn',
        details: {
          affiliate_id: affiliate.id,
          velocity_24h: velocity24h,
          threshold: VELOCITY_THRESHOLD_24H,
          attempted_user_id: userId
        }
      });
      // Still allow registration but don't award points
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration recorded but velocity limit reached',
          velocityLimitReached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // RACE-CONDITION FIX: Use atomic count from the database
    const { data: actualCount, error: countError } = await supabase
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id)
      .not('registered_user_id', 'is', null);

    if (countError) {
      console.error('Error counting referrals:', countError);
    }

    const newTotalRegistrations = actualCount || (affiliate.total_registrations || 0) + 1;
    const { level: newLevel, boost: newBoost } = calculateMiningBoost(newTotalRegistrations);

    // Update total registrations count and mining boost for the referrer's affiliate record
    const updateData: Record<string, any> = { 
      total_registrations: newTotalRegistrations,
      registration_milestone_level: newLevel,
      miner_boost_percentage: newBoost,
      updated_at: new Date().toISOString()
    };
    
    // Mark if referral cap is now reached
    if (newTotalRegistrations >= maxReferrals) {
      updateData.referrals_capped_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('affiliates')
      .update(updateData)
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('Error updating registration count:', updateError);
    }

    // ==========================================================
    // SAFEGUARD 3: Split referral bonus (immediate + activity-gated)
    // Referral points BYPASS daily/monthly caps (only lifetime enforced)
    // ==========================================================
    
    // Award IMMEDIATE bonus to the REFERRER (only 20 pts now)
    // Uses add_referral_points RPC to bypass daily/monthly caps
    if (affiliate.user_id) {
      const { data: referrerResult, error: referrerError } = await supabase
        .rpc('add_referral_points', {
          p_user_id: affiliate.user_id,
          p_points: IMMEDIATE_SIGNUP_BONUS,
          p_source: 'referral_immediate'
        });
      
      if (referrerError) {
        console.error('Error awarding referrer points:', referrerError);
      } else {
        console.log(`Awarded ${IMMEDIATE_SIGNUP_BONUS} immediate points to referrer ${affiliate.user_id} (bypassed caps)`, referrerResult);
      }
      
      // Create PENDING bonus record for the remaining 30 pts (requires first contribution)
      // Use upsert with ignoreDuplicates
      const { error: pendingError } = await supabase
        .from('pending_referral_bonuses')
        .upsert({
          referrer_user_id: affiliate.user_id,
          referred_user_id: userId,
          bonus_points: ACTIVITY_GATED_BONUS,
          requirement_type: 'first_contribution',
          requirement_met: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }, { onConflict: 'referred_user_id', ignoreDuplicates: true });
      
      if (pendingError) {
        console.error('Error creating pending bonus (may already exist):', pendingError.message);
      } else {
        console.log(`Created pending bonus of ${ACTIVITY_GATED_BONUS} pts for referrer, awaiting invitee first contribution`);
      }
    }

    // Award FULL bonus to the NEW USER (invitee still gets 50 pts immediately as welcome)
    // Uses add_referral_points RPC to bypass daily/monthly caps
    const { data: inviteeResult, error: inviteeError } = await supabase
      .rpc('add_referral_points', {
        p_user_id: userId,
        p_points: REFERRAL_BONUS_POINTS,
        p_source: 'referral_welcome'
      });
    
    if (inviteeError) {
      console.error('Error awarding invitee points:', inviteeError);
    } else {
      console.log(`Awarded ${REFERRAL_BONUS_POINTS} points to new user ${userId} (bypassed caps)`, inviteeResult);
    }

    console.log(`Registration tracked successfully for affiliate ${affiliate.affiliate_code}, count: ${newTotalRegistrations}, boost: ${newBoost}%`);
    
    // Send welcome email to the new referred user
    if (newUserEmail) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
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
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Registration tracked successfully',
        affiliateCode: affiliate.affiliate_code,
        pointsAwarded: {
          inviteeImmediate: REFERRAL_BONUS_POINTS,
          referrerImmediate: IMMEDIATE_SIGNUP_BONUS,
          referrerPending: ACTIVITY_GATED_BONUS
        },
        bypassedCaps: true, // Referral points bypass daily/monthly caps
        newMiningBoost: newBoost,
        referralCount: newTotalRegistrations,
        maxReferrals: maxReferrals
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
