import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const registrationSchema = z.object({
  referralCode: z.string().min(1).max(50),
  userId: z.string().uuid(),
  referrer: z.string().optional(),
});

const REFERRER_BONUS_POINTS = 50;
const INVITEE_BONUS_POINTS = 50;
const VELOCITY_THRESHOLD_24H = 10;
const MAX_REFERRALS_DEFAULT = 100;

function detectSource(referrerUrl: string | null): string {
  if (!referrerUrl) return "direct";
  const url = referrerUrl.toLowerCase();
  if (url.includes("facebook.com") || url.includes("fb.com")) return "facebook";
  if (url.includes("twitter.com") || url.includes("t.co")) return "twitter";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("youtube.com")) return "youtube";
  if (url.includes("pinterest.com")) return "pinterest";
  if (url.includes("whatsapp.com")) return "whatsapp";
  if (url.includes("telegram")) return "telegram";
  if (url.includes("discord")) return "discord";
  return "other";
}

function calculateMiningBoost(totalRegistrations: number): { level: number; boost: number } {
  if (totalRegistrations >= 100) return { level: 5, boost: 100 };
  if (totalRegistrations >= 50) return { level: 4, boost: 70 };
  if (totalRegistrations >= 30) return { level: 3, boost: 40 };
  if (totalRegistrations >= 15) return { level: 2, boost: 20 };
  if (totalRegistrations >= 5) return { level: 1, boost: 10 };
  return { level: 0, boost: 0 };
}

async function resolveAffiliate(supabase: ReturnType<typeof createClient>, referralInput: string) {
  const normalized = referralInput.trim();
  const lower = normalized.toLowerCase();
  const upper = normalized.toUpperCase();

  const selectFields =
    "id, affiliate_code, total_registrations, username, user_id, miner_boost_percentage, registration_milestone_level, max_referrals";

  const tryByCode = async (code: string) =>
    supabase
      .from("affiliates")
      .select(selectFields)
      .eq("affiliate_code", code)
      .eq("status", "active")
      .eq("email_verified", true)
      .maybeSingle();

  let result = await tryByCode(normalized);
  if (!result.data && upper !== normalized) result = await tryByCode(upper);
  if (!result.data && lower !== normalized) result = await tryByCode(lower);

  if (!result.data) {
    result = await supabase
      .from("affiliates")
      .select(selectFields)
      .eq("username", lower)
      .eq("status", "active")
      .eq("email_verified", true)
      .maybeSingle();
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const apiKey = req.headers.get("apikey");
    const expectedServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!expectedServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isServiceCall =
      (authHeader && authHeader === `Bearer ${expectedServiceKey}`) ||
      (apiKey && apiKey === expectedServiceKey);

    if (!isServiceCall) {
      return new Response(JSON.stringify({ error: "Unauthorized - internal endpoint only" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.json();
    const validationResult = registrationSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { referralCode, userId, referrer } = validationResult.data;
    const source = detectSource(referrer || null);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: affiliate, error: affError } = await resolveAffiliate(supabase, referralCode);

    if (affError) throw affError;

    if (!affiliate) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (affiliate.user_id && affiliate.user_id === userId) {
      return new Response(JSON.stringify({ error: "Self-referrals are not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const maxReferrals = affiliate.max_referrals || MAX_REFERRALS_DEFAULT;
    if ((affiliate.total_registrations || 0) >= maxReferrals) {
      return new Response(
        JSON.stringify({ success: true, message: "Registration recorded but referral cap reached", referralCapReached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { count: recentReferralsCount } = await supabase
      .from("affiliate_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliate.id)
      .gte("registered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const velocity24h = recentReferralsCount || 0;
    if (velocity24h >= VELOCITY_THRESHOLD_24H) {
      await supabase.from("security_audit_log").insert({
        user_id: affiliate.user_id,
        event_type: "referral_velocity_exceeded",
        severity: "warn",
        details: {
          affiliate_id: affiliate.id,
          velocity_24h: velocity24h,
          threshold: VELOCITY_THRESHOLD_24H,
          attempted_user_id: userId,
        },
      });

      return new Response(
        JSON.stringify({ success: true, message: "Registration recorded but velocity limit reached", velocityLimitReached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: newUserData } = await supabase.auth.admin.getUserById(userId);
    const newUserEmail = newUserData?.user?.email;

    const { data: existingReferral } = await supabase
      .from("affiliate_referrals")
      .select("id")
      .eq("registered_user_id", userId)
      .limit(1);

    if (existingReferral && existingReferral.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: "User already registered via referral", alreadyRegistered: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: insertError } = await supabase.from("affiliate_referrals").insert({
      affiliate_id: affiliate.id,
      visitor_id: userId,
      registered_user_id: userId,
      status: "registered",
      source,
      commission_level: 1,
      clicked_at: new Date().toISOString(),
      registered_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    const { count: actualCount } = await supabase
      .from("affiliate_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliate.id)
      .not("registered_user_id", "is", null);

    const newTotalRegistrations = actualCount || (affiliate.total_registrations || 0) + 1;
    const { level: newLevel, boost: newBoost } = calculateMiningBoost(newTotalRegistrations);

    const updateData: Record<string, unknown> = {
      total_registrations: newTotalRegistrations,
      registration_milestone_level: newLevel,
      miner_boost_percentage: newBoost,
      updated_at: new Date().toISOString(),
    };

    if (newTotalRegistrations >= maxReferrals) {
      updateData.referrals_capped_at = new Date().toISOString();
    }

    await supabase.from("affiliates").update(updateData).eq("id", affiliate.id);

    if (affiliate.user_id) {
      const { error: referrerError } = await supabase.rpc("add_referral_points", {
        p_user_id: affiliate.user_id,
        p_points: REFERRER_BONUS_POINTS,
        p_source: "referral_bonus",
      });

      if (referrerError) {
        await supabase.from("security_audit_log").insert({
          user_id: affiliate.user_id,
          event_type: "referral_points_failed",
          severity: "error",
          details: {
            referrer_user_id: affiliate.user_id,
            referred_user_id: userId,
            points_attempted: REFERRER_BONUS_POINTS,
            error: referrerError.message,
          },
        });
      }
    }

    const { error: inviteeError } = await supabase.rpc("add_referral_points", {
      p_user_id: userId,
      p_points: INVITEE_BONUS_POINTS,
      p_source: "referral_welcome",
    });

    if (inviteeError) {
      await supabase.from("security_audit_log").insert({
        user_id: userId,
        event_type: "invitee_points_failed",
        severity: "error",
        details: {
          invitee_user_id: userId,
          referrer_user_id: affiliate.user_id,
          points_attempted: INVITEE_BONUS_POINTS,
          error: inviteeError.message,
        },
      });
    }

    if (newUserEmail) {
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          type: "referral_welcome",
          to: newUserEmail,
          data: {
            referrerUsername: affiliate.username || affiliate.affiliate_code,
            bonusPoints: INVITEE_BONUS_POINTS,
          },
        }),
      }).catch((emailError) => console.error("Error sending referral welcome email:", emailError));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration tracked successfully",
        affiliateCode: affiliate.affiliate_code,
        pointsAwarded: { referrer: REFERRER_BONUS_POINTS, invitee: INVITEE_BONUS_POINTS },
        bypassedCaps: true,
        newMiningBoost: newBoost,
        referralCount: newTotalRegistrations,
        maxReferrals,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
