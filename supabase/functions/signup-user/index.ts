import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// Input validation
const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  referralCode: z.string().optional(),
});

// Generate 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash a code using SHA-256
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// SECURITY: Validate IP address format to prevent SSRF/injection
function isValidPublicIP(ip: string): boolean {
  if (!ip) return false;
  
  // Basic IPv4 format check
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  const parts = ip.split('.').map(Number);
  
  // Check each octet is valid
  if (parts.some(p => p < 0 || p > 255)) return false;
  
  // Block private/reserved ranges (RFC 1918, loopback, link-local, multicast)
  const [a, b] = parts;
  if (a === 10) return false;                          // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return false;   // 172.16.0.0/12
  if (a === 192 && b === 168) return false;            // 192.168.0.0/16
  if (a === 127) return false;                         // 127.0.0.0/8
  if (a === 169 && b === 254) return false;            // 169.254.0.0/16
  if (a === 0) return false;                           // 0.0.0.0/8
  if (a >= 224) return false;                          // 224.0.0.0+ (multicast/reserved)
  if (a === 100 && b >= 64 && b <= 127) return false;  // 100.64.0.0/10 (CGN)
  
  return true;
}

// Detect country from IP using free ip-api.com service
// SECURITY: Non-blocking, doesn't affect signup success, fails safely
async function detectCountryFromIP(req: Request): Promise<string | null> {
  try {
    // Get IP from headers (edge function receives forwarded IP)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let ip = forwardedFor?.split(',')[0]?.trim() || realIp || null;
    
    // SECURITY: Validate IP format and block private ranges
    if (!ip || !isValidPublicIP(ip)) {
      // Don't log specific blocked IP to avoid info leakage
      // SECURITY: Don't log IP-related info
      return null;
    }
    
    // Use ip-api.com (free, no API key needed, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && data.countryCode) {
      return data.countryCode;
    }
    
    return null;
  } catch (error) {
    // Fail silently - don't log errors that might reveal internal info
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validationResult = signupSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, referralCode } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile && existingProfile.email_verified) {
      return new Response(
        JSON.stringify({ error: "An account with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false, // We use our own verification
    });

    if (authError) {
      // SECURITY: Log error type only, not details
      console.error("Auth error occurred during signup");
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    const userId = authData.user.id;

    // Generate verification code
    const code = generateCode();
    const hashedCode = await hashCode(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Generate a unique temporary username using user_id to guarantee uniqueness
    const tempUsername = `user_${userId.replace(/-/g, '').substring(0, 12)}`;

    // Detect country from IP (non-blocking, don't fail signup if this fails)
    const countryCode = await detectCountryFromIP(req);

    // Create profile with verification code (using service role)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        username: tempUsername,
        email: normalizedEmail,
        email_verified: false,
        is_early_member: true,
        verification_code: hashedCode,
        verification_code_expires_at: expiresAt,
        country_code: countryCode,
      }, { onConflict: 'user_id' });

    if (profileError) {
      // SECURITY: Log error type only, not full error details
      console.error("Profile creation error occurred");
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // Track affiliate referral if code provided
    if (referralCode) {
      try {
        const trackResponse = await fetch(`${supabaseUrl}/functions/v1/track-affiliate-registration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            referralCode,
            userId,
            referrer: '',
          }),
        });
        
        if (!trackResponse.ok) {
          // SECURITY: Log failure without exposing response details
          console.error("Affiliate tracking failed");
        }
      } catch (trackError) {
        // SECURITY: Don't log error details
        console.error("Affiliate tracking error");
        // Don't fail signup if tracking fails
      }
    }

    // Send verification email
    const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        type: 'user_verification',
        to: normalizedEmail,
        data: { code },
      }),
    });

    if (!sendEmailResponse.ok) {
      // SECURITY: Log failure without exposing email or response details
      console.error("Failed to send verification email");
      // Don't fail signup if email fails - user can resend
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created. Please check your email for verification code.",
        userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    // SECURITY: Log error occurrence only, not details that could aid attackers
    console.error("Signup function error occurred");
    return new Response(
      JSON.stringify({ error: "Signup failed. Please try again or contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
