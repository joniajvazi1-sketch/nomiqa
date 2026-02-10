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
  
  if (BLOCKED_DOMAINS.has(domain)) return true;
  
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
  
  if (ip.includes(':')) {
    const ipLower = ip.toLowerCase();
    if (ipLower === '::1') return false;
    if (ipLower.startsWith('::ffff:')) {
      const ipv4Part = ipLower.replace('::ffff:', '');
      return isValidPublicIPv4(ipv4Part);
    }
    if (ipLower.startsWith('fc') || ipLower.startsWith('fd')) return false;
    if (ipLower.startsWith('fe80')) return false;
    if (ipLower.startsWith('fec0')) return false;
    if (ipLower.startsWith('ff')) return false;
    if (ipLower === '::') return false;
    if (ipLower.startsWith('2001:db8')) return false;
    if (ipLower.startsWith('2001:') && ipLower.charAt(5) === '0') return false;
    if (ipLower.startsWith('2002:')) return false;
    if (ipLower.startsWith('64:ff9b')) return false;
    if (ipLower.startsWith('100::')) return false;
    return true;
  }
  
  return isValidPublicIPv4(ip);
}

function isValidPublicIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  const parts = ip.split('.').map(Number);
  if (parts.some(p => p < 0 || p > 255)) return false;
  
  const [a, b] = parts;
  if (a === 10) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 0) return false;
  if (a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  
  return true;
}

// Detect country from IP — NON-BLOCKING with 1.5s timeout via Promise.race
// If detection fails or times out, returns null without delaying signup
async function detectCountryFromIP(req: Request): Promise<string | null> {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let ip = forwardedFor?.split(',')[0]?.trim() || realIp || null;
    
    if (!ip || !isValidPublicIP(ip)) {
      return null;
    }
    
    // Race the IP lookup against a 1.5s timeout — never block signup
    const result = await Promise.race([
      (async () => {
        try {
          const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`, {
            signal: AbortSignal.timeout(1500),
          });
          if (!response.ok) return null;
          const data = await response.json();
          return data.status === 'success' && data.countryCode ? data.countryCode : null;
        } catch {
          return null;
        }
      })(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    
    return result;
  } catch {
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    const validationResult = signupSchema.safeParse(rawBody);
    if (!validationResult.success) {
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

    // SECURITY: Block suspicious username patterns
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
      const encoder = new TextEncoder();
      const ipData = encoder.encode(clientIP);
      const ipHashBuffer = await crypto.subtle.digest('SHA-256', ipData);
      const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
      
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
        await supabase.from('api_rate_limits').insert({
          identifier: ipHash,
          endpoint: 'signup',
          request_count: 1,
          window_start: now.toISOString()
        });
      }
    }

    // Check if user already exists via profiles table (fast, indexed query)
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
      email_confirm: false,
    });

    if (authError) {
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

    const finalUsername = username?.toLowerCase().trim() || `user_${userId.replace(/-/g, '').substring(0, 12)}`;

    // Start country detection in parallel — non-blocking, capped at 1.5s
    const countryPromise = detectCountryFromIP(req);

    // Wait for country detection (max 1.5s due to Promise.race inside)
    const countryCode = await countryPromise;

    // Create profile with verification code
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
      console.error("Profile creation error occurred");
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // FIRE-AND-FORGET: Track affiliate referral (don't await)
    if (referralCode) {
      fetch(`${supabaseUrl}/functions/v1/track-affiliate-registration`, {
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
      }).catch(() => {
        console.error("Affiliate tracking error (fire-and-forget)");
      });
    }

    // FIRE-AND-FORGET: Send verification email (don't await — shaves 1-2s)
    fetch(`${supabaseUrl}/functions/v1/send-email`, {
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
    }).catch(() => {
      console.error("Failed to send verification email (fire-and-forget)");
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created. Please check your email for verification code.",
        userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Signup function error occurred");
    return new Response(
      JSON.stringify({ error: "Signup failed. Please try again or contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
