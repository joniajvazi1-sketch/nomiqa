import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation helpers
function sanitizeString(input: unknown, maxLength: number): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'string') return null;
  
  // Remove control characters and null bytes
  const sanitized = input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
  
  return sanitized.substring(0, maxLength) || null;
}

function validateAffiliateCode(code: unknown): string | null {
  if (!code || typeof code !== 'string') return null;
  
  // Affiliate codes should be alphanumeric with optional hyphens/underscores
  const sanitized = code.trim();
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(sanitized)) return null;
  
  return sanitized;
}

function validateUrl(url: unknown, maxLength: number): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  
  // Basic URL validation - must start with http:// or https://
  if (!/^https?:\/\/.+/i.test(trimmed)) return null;
  
  // Remove any control characters
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '').substring(0, maxLength);
}

function validateUsername(username: unknown): string | null {
  if (!username || typeof username !== 'string') return null;
  
  const sanitized = username.trim();
  // Username should be alphanumeric with optional underscores, max 50 chars
  if (!/^[a-zA-Z0-9_]{1,50}$/.test(sanitized)) return null;
  
  return sanitized;
}

function validateUuid(id: unknown): string | null {
  if (!id || typeof id !== 'string') return null;
  
  const trimmed = id.trim();
  // Standard UUID format validation
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return null;
  
  return trimmed;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize all inputs
    const affiliateCode = validateAffiliateCode(body.affiliateCode);
    const affiliateUsername = validateUsername(body.affiliateUsername);
    const affiliateId = validateUuid(body.affiliateId);
    const referrerUrl = validateUrl(body.referrerUrl, 500);
    const landingPage = sanitizeString(body.landingPage, 200);
    const userAgent = sanitizeString(body.userAgent, 300);

    // At least one identifier must be valid
    if (!affiliateCode && !affiliateUsername && !affiliateId) {
      console.log('No valid affiliate identifier provided');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hash the IP for privacy (we don't store raw IPs)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const ipHash = await hashString(ip);

    // Generate a fingerprint from user agent + IP hash
    const fingerprint = await hashString(`${userAgent || 'unknown'}-${ipHash}`);

    // Log the referral visit with validated inputs
    const { error } = await supabase
      .from('referral_audit_log')
      .insert({
        affiliate_code: affiliateCode,
        affiliate_username: affiliateUsername,
        affiliate_id: affiliateId,
        visitor_fingerprint: fingerprint.substring(0, 16),
        referrer_url: referrerUrl,
        landing_page: landingPage,
        ip_hash: ipHash.substring(0, 16),
        user_agent: userAgent,
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
