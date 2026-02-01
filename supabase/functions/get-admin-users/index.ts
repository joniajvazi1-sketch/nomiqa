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

    // Get the authorization header to verify the user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Get client info for audit logging
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

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
      // SECURITY: Log unauthorized admin access attempt
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

    // SECURITY: Log successful admin access
    await adminClient.from('webhook_logs').insert({
      event_type: 'admin_access_granted',
      payload: {
        admin_user_id: user.id,
        ip: clientIP,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
        action: 'get_admin_users'
      }
    });

    // Fetch all profiles with country_code (handle pagination for large datasets)
    let allProfiles: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: profiles, error: profilesError } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) break;
      
      allProfiles = [...allProfiles, ...profiles];
      if (profiles.length < pageSize) break;
      page++;
    }
    
    const profiles = allProfiles;

    // Fetch all affiliates (handle pagination for large datasets)
    let allAffiliates: any[] = [];
    let affiliatePage = 0;
    
    while (true) {
      const { data: affiliatesBatch, error: affiliatesError } = await adminClient
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false })
        .range(affiliatePage * pageSize, (affiliatePage + 1) * pageSize - 1);
      
      if (affiliatesError) throw affiliatesError;
      if (!affiliatesBatch || affiliatesBatch.length === 0) break;
      
      allAffiliates = [...allAffiliates, ...affiliatesBatch];
      if (affiliatesBatch.length < pageSize) break;
      affiliatePage++;
    }
    
    const affiliates = allAffiliates;

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

    // SECURITY: Log data access details for audit trail
    await adminClient.from('webhook_logs').insert({
      event_type: 'admin_data_accessed',
      payload: {
        admin_user_id: user.id,
        ip: clientIP,
        timestamp: new Date().toISOString(),
        action: 'get_admin_users',
        records_accessed: {
          profiles: profiles?.length || 0,
          affiliates: affiliates?.length || 0,
          referrals: referrals?.length || 0
        }
      }
    });

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
    // SECURITY: Log error occurrence only, not details
    console.error("Error in admin users function");
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
