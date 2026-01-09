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

// Detect country from IP using free ip-api.com service
async function detectCountryFromIP(req: Request): Promise<string | null> {
  try {
    // Get IP from headers (edge function receives forwarded IP)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || null;
    
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      console.log('No valid IP for geolocation');
      return null;
    }
    
    console.log(`Detecting country for IP: ${ip.substring(0, 8)}...`);
    
    // Use ip-api.com (free, no API key needed, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (!response.ok) {
      console.error('IP geolocation request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && data.countryCode) {
      console.log(`Detected country: ${data.countryCode}`);
      return data.countryCode;
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting country:', error);
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
      console.error("Auth error:", authError);
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
      console.error("Profile error:", profileError);
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // Track affiliate referral if code provided
    if (referralCode) {
      console.log(`Tracking referral registration - code: ${referralCode}, userId: ${userId}`);
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
        
        const trackResult = await trackResponse.json();
        console.log(`Affiliate tracking response:`, trackResult);
        
        if (!trackResponse.ok) {
          console.error(`Affiliate tracking failed: ${trackResponse.status}`, trackResult);
        } else {
          console.log(`✓ Referral registration tracked successfully for code: ${referralCode}`);
        }
      } catch (trackError) {
        console.error("Error tracking affiliate:", trackError);
        // Don't fail signup if tracking fails
      }
    } else {
      console.log('No referral code provided for this signup');
    }

    // Send verification email
    console.log(`Sending verification email to ${normalizedEmail}`);
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
      const errorText = await sendEmailResponse.text();
      console.error(`Failed to send verification email: ${sendEmailResponse.status} - ${errorText}`);
      // Don't fail signup if email fails - user can resend
    } else {
      console.log(`✓ Verification email sent to ${normalizedEmail}`);
    }

    console.log(`User created successfully: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created. Please check your email for verification code.",
        userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in signup-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Signup failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
