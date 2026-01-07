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

    // Get the authorization header to verify the user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify they're an admin
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

    // Check if user has admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all profiles with country_code
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch all affiliates
    const { data: affiliates, error: affiliatesError } = await adminClient
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    if (affiliatesError) throw affiliatesError;

    // Fetch all referrals with details
    const { data: referrals, error: referralsError } = await adminClient
      .from("affiliate_referrals")
      .select(`
        *,
        affiliates:affiliate_id (
          email,
          username,
          affiliate_code
        )
      `)
      .order("created_at", { ascending: false });

    if (referralsError) throw referralsError;

    // Combine data - map profiles to their affiliate info (aggregate all affiliates for same user)
    const usersWithReferrals = profiles?.map((profile) => {
      // Get ALL affiliates for this user and aggregate their stats
      const userAffiliates = affiliates?.filter((a) => a.user_id === profile.user_id) || [];
      const hasAffiliates = userAffiliates.length > 0;
      
      // Aggregate stats from all affiliates
      const totalRegistrations = userAffiliates.reduce((sum, a) => sum + (a.total_registrations || 0), 0);
      const totalConversions = userAffiliates.reduce((sum, a) => sum + (a.total_conversions || 0), 0);
      const totalEarnings = userAffiliates.reduce((sum, a) => sum + (a.total_earnings_usd || 0), 0);
      const maxTierLevel = Math.max(...userAffiliates.map(a => a.tier_level || 0), 0);
      const maxMinerBoost = Math.max(...userAffiliates.map(a => a.miner_boost_percentage || 0), 0);
      
      // Get affiliate usernames for display
      const affiliateUsernames = userAffiliates
        .map(a => a.username)
        .filter(Boolean)
        .join(', ');

      const userReferrals = referrals?.filter((r) => r.registered_user_id === profile.user_id) || [];
      const referredBy = userReferrals.length > 0 ? userReferrals[0]?.affiliates : null;

      return {
        id: profile.id,
        user_id: profile.user_id,
        username: profile.username,
        email: profile.email,
        email_verified: profile.email_verified,
        solana_wallet: profile.solana_wallet,
        is_early_member: profile.is_early_member,
        created_at: profile.created_at,
        country_code: profile.country_code || null,
        // Affiliate info (aggregated from all user's affiliates)
        is_affiliate: hasAffiliates,
        affiliate_count: userAffiliates.length,
        affiliate_usernames: affiliateUsernames,
        total_registrations: totalRegistrations,
        total_conversions: totalConversions,
        total_earnings_usd: totalEarnings,
        tier_level: maxTierLevel,
        miner_boost_percentage: maxMinerBoost,
        // Who referred this user
        referred_by: referredBy ? {
          email: referredBy.email,
          username: referredBy.username,
          affiliate_code: referredBy.affiliate_code,
        } : null,
        referral_status: userReferrals.length > 0 ? userReferrals[0]?.status : null,
      };
    }) || [];

    // Summary stats
    const stats = {
      total_users: profiles?.length || 0,
      verified_emails: profiles?.filter((p) => p.email_verified).length || 0,
      wallets_connected: profiles?.filter((p) => p.solana_wallet).length || 0,
      total_affiliates: affiliates?.length || 0,
      total_referrals: referrals?.filter((r) => r.status === "registered" || r.status === "converted").length || 0,
      total_conversions: referrals?.filter((r) => r.status === "converted").length || 0,
    };

    return new Response(
      JSON.stringify({ users: usersWithReferrals, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error fetching admin users:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
