import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const createAffiliateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  userId: z.string().uuid().optional(),
  sendWelcomeOnly: z.boolean().optional(),
  referralCode: z.string().max(50).optional(),
  referrer: z.string().optional(),
});

const generateSecureCode = (): string => {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .substring(0, 10);
};

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function buildAffiliateCode(supabase: ReturnType<typeof createClient>, username?: string) {
  const normalizedUsername = username?.toLowerCase();

  if (normalizedUsername) {
    const { data: collision } = await supabase
      .from("affiliates")
      .select("id")
      .or(`affiliate_code.eq.${normalizedUsername},username.eq.${normalizedUsername}`)
      .maybeSingle();

    if (collision) {
      throw new Error("This referral code is already taken. Please choose another username.");
    }

    return normalizedUsername;
  }

  let affiliateCode = generateSecureCode();
  let attempts = 0;

  while (attempts < 10) {
    const { data } = await supabase
      .from("affiliates")
      .select("id")
      .eq("affiliate_code", affiliateCode)
      .maybeSingle();

    if (!data) return affiliateCode;

    affiliateCode = generateSecureCode();
    attempts += 1;
  }

  throw new Error("Failed to generate unique affiliate code. Please try again.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = createAffiliateSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, username, userId, sendWelcomeOnly, referralCode, referrer } = validationResult.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (sendWelcomeOnly) {
      if (referralCode && userId) {
        try {
          const trackResponse = await fetch(`${supabaseUrl}/functions/v1/track-affiliate-registration`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ referralCode, userId, referrer: referrer || "" }),
          });

          if (!trackResponse.ok) {
            console.error("OAuth referral tracking failed:", trackResponse.status, await trackResponse.text());
          }
        } catch (trackError) {
          console.error("Error tracking OAuth referral:", trackError);
        }
      }

      try {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: "early_member_welcome",
            to: email,
            data: { username: email.split("@")[0] },
          }),
        });

        return new Response(JSON.stringify({ success: true, message: "Welcome email sent", referralTracked: !!referralCode }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ success: false, error: "Failed to send welcome email" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (username) {
      const normalized = username.toLowerCase();
      const { data: existingUsername } = await supabase
        .from("affiliates")
        .select("id")
        .or(`username.eq.${normalized},affiliate_code.eq.${normalized}`)
        .maybeSingle();

      if (existingUsername) {
        return new Response(JSON.stringify({ error: "This username is already taken. Please choose a different one." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from("affiliates")
      .select("id")
      .eq("email", email)
      .gte("created_at", oneDayAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many affiliate accounts created for this email. Please try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let isUserVerified = false;

    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile?.email_verified) isUserVerified = true;

      if (!isUserVerified) {
        const { data: verifiedAffiliate } = await supabase
          .from("affiliates")
          .select("id")
          .eq("user_id", userId)
          .eq("email_verified", true)
          .limit(1)
          .maybeSingle();

        if (verifiedAffiliate) isUserVerified = true;
      }

      const { data: unlinkedAffiliate } = await supabase
        .from("affiliates")
        .select("*")
        .eq("email", email)
        .is("user_id", null)
        .maybeSingle();

      if (unlinkedAffiliate) {
        await supabase
          .from("affiliates")
          .update({ user_id: userId, ...(isUserVerified ? { email_verified: true, status: "active" } : {}) })
          .eq("id", unlinkedAffiliate.id);

        return new Response(
          JSON.stringify({
            affiliate: {
              ...unlinkedAffiliate,
              user_id: userId,
              ...(isUserVerified ? { email_verified: true, status: "active" } : {}),
            },
            requiresVerification: !isUserVerified && !unlinkedAffiliate.email_verified,
            message: "Existing affiliate account linked to your user profile",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const affiliateCode = await buildAffiliateCode(supabase, username);

    if (isUserVerified) {
      const { data: affiliate, error: createError } = await supabase
        .from("affiliates")
        .insert({
          email,
          affiliate_code: affiliateCode,
          username: username ? username.toLowerCase() : null,
          user_id: userId || null,
          email_verified: true,
          status: "active",
          verification_token: null,
          verification_code_expires_at: null,
          verification_sent_at: null,
        })
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message || "Failed to create affiliate account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ affiliate, requiresVerification: false, message: "Affiliate account created successfully!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedVerificationCode = await hashCode(verificationCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: affiliate, error: createError } = await supabase
      .from("affiliates")
      .insert({
        email,
        affiliate_code: affiliateCode,
        username: username ? username.toLowerCase() : null,
        user_id: userId || null,
        email_verified: false,
        verification_token: hashedVerificationCode,
        verification_code_expires_at: expiresAt,
        verification_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message || "Failed to create affiliate account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ type: "affiliate_verification", to: email, data: { code: verificationCode } }),
    }).catch((emailError) => console.error("Error sending verification email:", emailError));

    return new Response(JSON.stringify({ affiliate, requiresVerification: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
