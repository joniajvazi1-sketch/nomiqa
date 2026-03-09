import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Parse query params for pagination and search
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const search = url.searchParams.get('search') || '';
    const clampedPageSize = Math.min(Math.max(pageSize, 10), 100);

    // Verify user is admin
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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      await adminClient.from('webhook_logs').insert({
        event_type: 'admin_access_denied',
        payload: {
          user_id: user.id,
          ip: clientIP,
          userAgent: userAgent.substring(0, 100),
          timestamp: new Date().toISOString(),
          action: 'get_admin_users'
        }
      });

      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log admin access
    await adminClient.from('webhook_logs').insert({
      event_type: 'admin_access_granted',
      payload: {
        admin_user_id: user.id,
        ip: clientIP,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
        action: 'get_admin_users',
        page,
        search: search ? search.substring(0, 50) : null,
      }
    });

    // ============================================================
    // EFFICIENT: Server-side pagination + search
    // Instead of loading ALL data, only load what's needed
    // ============================================================

    // Get total counts for stats (lightweight count queries)
    const [
      { count: totalProfiles },
      { count: verifiedEmails },
      { count: walletsConnected },
      { count: totalAffiliates },
      { count: totalReferrals },
      { count: totalConversions },
    ] = await Promise.all([
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("email_verified", true),
      adminClient.from("profiles").select("id", { count: "exact", head: true }).not("solana_wallet", "is", null),
      adminClient.from("affiliates").select("id", { count: "exact", head: true }),
      adminClient.from("affiliate_referrals").select("id", { count: "exact", head: true }).in("status", ["registered", "converted"]),
      adminClient.from("affiliate_referrals").select("id", { count: "exact", head: true }).eq("status", "converted"),
    ]);

    const stats = {
      total_users: totalProfiles || 0,
      verified_emails: verifiedEmails || 0,
      wallets_connected: walletsConnected || 0,
      total_affiliates: totalAffiliates || 0,
      total_referrals: totalReferrals || 0,
      total_conversions: totalConversions || 0,
    };

    // Fetch paginated profiles with optional search
    let profilesQuery = adminClient
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    
    if (search) {
      profilesQuery = profilesQuery.or(
        `username.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data: profiles, error: profilesError, count: filteredCount } = await profilesQuery
      .range(page * clampedPageSize, (page + 1) * clampedPageSize - 1);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ users: [], stats, totalFiltered: filteredCount || 0, page, pageSize: clampedPageSize }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user_ids for this page to do targeted lookups
    const userIds = profiles.map(p => p.user_id);

    // Fetch affiliates and referrals ONLY for users on this page (parallel)
    const [affiliatesResult, referralsResult] = await Promise.all([
      adminClient
        .from("affiliates")
        .select("*")
        .in("user_id", userIds),
      adminClient
        .from("affiliate_referrals")
        .select(`
          registered_user_id,
          status,
          affiliates:affiliate_id (
            email,
            username,
            affiliate_code
          )
        `)
        .in("registered_user_id", userIds),
    ]);

    const affiliates = affiliatesResult.data || [];
    const referrals = referralsResult.data || [];

    // Build user data for this page
    const usersWithReferrals = profiles.map((profile) => {
      const userAffiliates = affiliates.filter((a) => a.user_id === profile.user_id);
      const hasAffiliates = userAffiliates.length > 0;
      
      const totalRegistrations = userAffiliates.reduce((sum, a) => sum + (a.total_registrations || 0), 0);
      const totalConversionsUser = userAffiliates.reduce((sum, a) => sum + (a.total_conversions || 0), 0);
      const totalEarnings = userAffiliates.reduce((sum, a) => sum + (a.total_earnings_usd || 0), 0);
      const maxTierLevel = userAffiliates.length > 0 
        ? Math.max(...userAffiliates.map(a => a.tier_level || 0)) 
        : 0;
      const maxMinerBoost = userAffiliates.length > 0
        ? Math.max(...userAffiliates.map(a => a.miner_boost_percentage || 0))
        : 0;
      
      const affiliateUsernames = userAffiliates
        .map(a => a.username)
        .filter(Boolean)
        .join(', ');

      const userReferrals = referrals.filter((r) => r.registered_user_id === profile.user_id);
      const referredBy = userReferrals.length > 0 ? (userReferrals[0] as any)?.affiliates : null;

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
        is_affiliate: hasAffiliates,
        affiliate_count: userAffiliates.length,
        affiliate_usernames: affiliateUsernames,
        total_registrations: totalRegistrations,
        total_conversions: totalConversionsUser,
        total_earnings_usd: totalEarnings,
        tier_level: maxTierLevel,
        miner_boost_percentage: maxMinerBoost,
        referred_by: referredBy ? {
          email: referredBy.email,
          username: referredBy.username,
          affiliate_code: referredBy.affiliate_code,
        } : null,
        referral_status: userReferrals.length > 0 ? userReferrals[0]?.status : null,
      };
    });

    return new Response(
      JSON.stringify({ 
        users: usersWithReferrals, 
        stats, 
        totalFiltered: filteredCount || 0,
        page,
        pageSize: clampedPageSize,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in admin users function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
