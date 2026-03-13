import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const schema = z.object({
  referralCode: z.string().min(3).max(20),
  affiliateId: z.string().uuid().optional(),
});

const CODE_REGEX = /^[a-z0-9_]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedCode = parsed.data.referralCode.trim().toLowerCase();

    if (!CODE_REGEX.test(normalizedCode)) {
      return new Response(JSON.stringify({ error: "Referral code can only contain lowercase letters, numbers, and underscores" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let affiliateQuery = admin
      .from("affiliates")
      .select("id, affiliate_code, username, user_id")
      .eq("user_id", user.id);

    if (parsed.data.affiliateId) affiliateQuery = affiliateQuery.eq("id", parsed.data.affiliateId);

    const { data: affiliate, error: affiliateError } = await affiliateQuery.order("created_at", { ascending: true }).limit(1).maybeSingle();

    if (affiliateError || !affiliate) {
      return new Response(JSON.stringify({ error: "Affiliate account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (affiliate.affiliate_code?.toLowerCase() === normalizedCode) {
      return new Response(JSON.stringify({ error: "This is already your referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: collisions } = await admin
      .from("affiliates")
      .select("id")
      .or(`affiliate_code.eq.${normalizedCode},username.eq.${normalizedCode}`)
      .neq("id", affiliate.id)
      .limit(1);

    if (collisions && collisions.length > 0) {
      return new Response(JSON.stringify({ error: "Referral code already taken" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: logs } = await admin
      .from("security_audit_log")
      .select("id, details")
      .eq("event_type", "affiliate_code_changed")
      .eq("user_id", user.id)
      .limit(20);

    const alreadyChanged = (logs || []).some((log) => {
      const affiliateId = (log.details as Record<string, unknown> | null)?.affiliate_id;
      return typeof affiliateId === "string" && affiliateId === affiliate.id;
    });

    if (alreadyChanged) {
      return new Response(JSON.stringify({ error: "Referral code can only be changed once" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await admin
      .from("affiliates")
      .update({ affiliate_code: normalizedCode, updated_at: new Date().toISOString() })
      .eq("id", affiliate.id)
      .eq("user_id", user.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message || "Failed to update referral code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("security_audit_log").insert({
      user_id: user.id,
      event_type: "affiliate_code_changed",
      severity: "info",
      details: {
        affiliate_id: affiliate.id,
        old_code: affiliate.affiliate_code,
        new_code: normalizedCode,
      },
    });

    return new Response(JSON.stringify({ success: true, referralCode: normalizedCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
