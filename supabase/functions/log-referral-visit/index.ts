import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      affiliateCode, 
      affiliateUsername, 
      affiliateId,
      referrerUrl, 
      landingPage,
      userAgent 
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hash the IP for privacy (we don't store raw IPs)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const ipHash = await hashString(ip);

    // Generate a fingerprint from user agent + IP hash
    const fingerprint = await hashString(`${userAgent || 'unknown'}-${ipHash}`);

    // Log the referral visit
    const { error } = await supabase
      .from('referral_audit_log')
      .insert({
        affiliate_code: affiliateCode,
        affiliate_username: affiliateUsername,
        affiliate_id: affiliateId,
        visitor_fingerprint: fingerprint.substring(0, 16),
        referrer_url: referrerUrl?.substring(0, 500),
        landing_page: landingPage?.substring(0, 200),
        ip_hash: ipHash.substring(0, 16),
        user_agent: userAgent?.substring(0, 300),
      });

    if (error) {
      console.error('Error logging referral visit:', error);
      // Don't fail the request - logging is non-critical
    } else {
      console.log(`Logged referral visit: ${affiliateUsername || affiliateCode}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in log-referral-visit:', error);
    // Always return success - we don't want to break the user flow
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
