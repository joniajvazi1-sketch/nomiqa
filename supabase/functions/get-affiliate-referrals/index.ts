import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header to verify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body for affiliate_id
    const { affiliate_id } = await req.json();
    if (!affiliate_id) {
      return new Response(JSON.stringify({ error: "affiliate_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to access data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the affiliate belongs to the requesting user
    const { data: affiliate, error: affiliateError } = await adminClient
      .from("affiliates")
      .select("id, user_id")
      .eq("id", affiliate_id)
      .single();

    if (affiliateError || !affiliate) {
      return new Response(JSON.stringify({ error: "Affiliate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security check: ensure the affiliate belongs to the requesting user
    if (affiliate.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch referrals for this affiliate
    const { data: referralData, error: referralError } = await adminClient
      .from("affiliate_referrals")
      .select("id, registered_user_id, registered_at, status")
      .eq("affiliate_id", affiliate_id)
      .not("registered_user_id", "is", null)
      .order("registered_at", { ascending: false });

    if (referralError) throw referralError;

    if (!referralData || referralData.length === 0) {
      return new Response(JSON.stringify({ referrals: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile info for each registered user (using service role)
    const userIds = referralData.map((r) => r.registered_user_id).filter(Boolean);

    const { data: profiles, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id, username, country_code")
      .in("user_id", userIds);

    if (profileError) throw profileError;

    // Map referrals with ONLY non-sensitive profile data (username, country_code)
    // Do NOT include email to protect user privacy
    const mappedReferrals = referralData.map((ref) => {
      const profile = profiles?.find((p) => p.user_id === ref.registered_user_id);
      return {
        id: ref.id,
        username: profile?.username || null,
        registeredAt: ref.registered_at || "",
        status: ref.status || "registered",
        hasConverted: ref.status === "converted",
        countryCode: profile?.country_code || null,
      };
    });

    console.log(`Fetched ${mappedReferrals.length} referrals for affiliate ${affiliate_id}`);

    return new Response(JSON.stringify({ referrals: mappedReferrals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching affiliate referrals:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
