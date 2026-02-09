import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// SECURITY: Known disposable/temporary email domains + bot domains
const BLOCKED_DOMAINS = new Set([
  // Disposable email providers
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.info',
  'guerrillamail.net', 'guerrillamail.org', 'mailinator.com', '10minutemail.com',
  'throwaway.email', 'fakeinbox.com', 'sharklasers.com', 'yopmail.com',
  'maildrop.cc', 'dispostable.com', 'getnada.com', 'trashmail.com',
  'mytrashmail.com', 'mailnesia.com', 'tempr.email', 'discard.email',
  'spamgourmet.com', 'mailcatch.com', 'emailondeck.com', 'moakt.com',
  'tempinbox.com', 'throwawaymail.com', 'mintemail.com', 'incognitomail.com',
  'tempail.com', 'fakemailgenerator.com', 'mohmal.com', 'emailfake.com',
  'crazymailing.com', 'temp.mail', 'burnermail.io',
  // Bot attack domains (detected from signup analysis)
  'virgilian.com', 'raleigh-construction.com', 'questtechsystems.com',
]);

// Check if email domain contains known disposable patterns
function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  
  // Direct match
  if (BLOCKED_DOMAINS.has(domain)) return true;
  
  // Pattern matching for common disposable indicators
  const suspiciousPatterns = [
    /^temp/i, /temp$/i, /^fake/i, /fake$/i, /^trash/i, /trash$/i,
    /^throw/i, /^disposable/i, /^mailinator/i, /^guerrilla/i,
    /10minute/i, /minutemail/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(domain));
}

// Input validation
const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
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
  
  // Check for IPv6 first
  if (ip.includes(':')) {
    // Block IPv6 loopback and private/reserved ranges
    const ipLower = ip.toLowerCase();
    if (ipLower === '::1') return false;                     // IPv6 loopback
    if (ipLower.startsWith('::ffff:')) {                      // IPv4-mapped IPv6
      // Extract the IPv4 portion and validate it
      const ipv4Part = ipLower.replace('::ffff:', '');
      return isValidPublicIPv4(ipv4Part);
    }
    if (ipLower.startsWith('fc') || ipLower.startsWith('fd')) return false;  // fc00::/7 (unique local)
    if (ipLower.startsWith('fe80')) return false;            // fe80::/10 (link-local)
    if (ipLower.startsWith('fec0')) return false;            // fec0::/10 (deprecated site-local)
    if (ipLower.startsWith('ff')) return false;              // ff00::/8 (multicast)
    if (ipLower === '::') return false;                      // Unspecified address
    if (ipLower.startsWith('2001:db8')) return false;        // 2001:db8::/32 (documentation/examples)
    if (ipLower.startsWith('2001:') && ipLower.charAt(5) === '0') return false; // 2001::/32 (Teredo tunneling)
    if (ipLower.startsWith('2002:')) return false;           // 2002::/16 (6to4)
    if (ipLower.startsWith('64:ff9b')) return false;         // 64:ff9b::/96 (IPv4/IPv6 translation)
    if (ipLower.startsWith('100::')) return false;           // 100::/64 (discard prefix)
    // Allow public IPv6 addresses
    return true;
  }
  
  // Validate IPv4
  return isValidPublicIPv4(ip);
}

// Validate IPv4 addresses
function isValidPublicIPv4(ip: string): boolean {
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
    // SECURITY: Using HTTPS endpoint (pro version) for secure transmission
    // Note: ip-api.com free tier only supports HTTP, but we prefer security
    // Fallback to HTTP if HTTPS fails (acceptable for non-sensitive geo data)
    let response;
    try {
      // Try HTTPS first (more secure)
      response = await fetch(`https://pro.ip-api.com/json/${ip}?fields=countryCode,status`, {
        signal: AbortSignal.timeout(2000), // 2 second timeout for HTTPS
      });
    } catch {
      // Fallback to HTTP if HTTPS unavailable (free tier limitation)
      response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`, {
        signal: AbortSignal.timeout(3000),
      });
    }
    
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
      // SECURITY: Log validation details server-side only, return generic error to client
      console.error("Signup validation failed");
      return new Response(
        JSON.stringify({ error: "Invalid input. Please check your email, password, and username format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, username, referralCode } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // SECURITY: Block disposable/bot email domains
    const emailDomain = normalizedEmail.split('@')[1];
    if (BLOCKED_DOMAINS.has(emailDomain) || isDisposableEmail(normalizedEmail)) {
      console.error("Blocked disposable/bot email domain signup attempt");
      return new Response(
        JSON.stringify({ error: "Please use a valid, non-disposable email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Block suspicious username patterns (hex-like, bot-generated)
    if (username) {
      const hexPattern = /^[a-f0-9]{6,}$/i;
      if (hexPattern.test(username)) {
        console.error("Blocked suspicious hex-pattern username");
        return new Response(
          JSON.stringify({ error: "Please choose a more descriptive username" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Rate limit signups per IP (max 10 per hour)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIP = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    
    if (clientIP !== 'unknown') {
      // Hash IP for privacy
      const encoder = new TextEncoder();
      const ipData = encoder.encode(clientIP);
      const ipHashBuffer = await crypto.subtle.digest('SHA-256', ipData);
      const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
      
      // Check rate limit
      const { data: rateData } = await supabase
        .from('api_rate_limits')
        .select('request_count, window_start')
        .eq('identifier', ipHash)
        .eq('endpoint', 'signup')
        .single();
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      if (rateData) {
        const windowStart = new Date(rateData.window_start);
        if (windowStart > oneHourAgo && rateData.request_count >= 10) {
          console.error("Rate limit exceeded for signup");
          return new Response(
            JSON.stringify({ error: "Too many signup attempts. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Update or reset counter
        if (windowStart <= oneHourAgo) {
          await supabase.from('api_rate_limits').update({
            request_count: 1,
            window_start: now.toISOString()
          }).eq('identifier', ipHash).eq('endpoint', 'signup');
        } else {
          await supabase.from('api_rate_limits').update({
            request_count: rateData.request_count + 1
          }).eq('identifier', ipHash).eq('endpoint', 'signup');
        }
      } else {
        // Create new rate limit entry
        await supabase.from('api_rate_limits').insert({
          identifier: ipHash,
          endpoint: 'signup',
          request_count: 1,
          window_start: now.toISOString()
        });
      }
    }

    // Check if user already exists via profiles table (fast, indexed query)
    // NOTE: Removed listUsers() call - it was scanning 13K+ users and causing timeouts.
    // The createUser() call below will catch auth-level duplicates via error handler.
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

    // Use provided username or generate a temporary one
    const finalUsername = username?.toLowerCase().trim() || `user_${userId.replace(/-/g, '').substring(0, 12)}`;

    // Detect country from IP (non-blocking, don't fail signup if this fails)
    const countryCode = await detectCountryFromIP(req);

    // Create profile with verification code (using service role)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        username: finalUsername,
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
