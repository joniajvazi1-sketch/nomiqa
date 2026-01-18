import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schema
const resendRequestSchema = z.object({
  email: z.string().email().max(255),
  type: z.enum(['registration', 'password_reset', 'affiliate'])
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

// SECURITY: Add artificial delay to mitigate timing attacks
const addSecurityDelay = async (startTime: number): Promise<void> => {
  const minResponseTime = 300; // Minimum 300ms response time
  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, minResponseTime - elapsed);
  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }
};

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validationResult = resendRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      // SECURITY: Don't expose validation details
      console.error("Resend validation error occurred");
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, type } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: max 3 resend requests per email per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentResends, error: rateLimitError } = await supabase
      .from('email_rate_limits')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('email_type', `resend_${type}`)
      .gte('sent_at', fifteenMinutesAgo);

    if (!rateLimitError && recentResends && recentResends.length >= 3) {
      // SECURITY: Log without exposing email
      console.log("Rate limit exceeded for resend request");
      return new Response(
        JSON.stringify({ error: 'Too many resend requests. Please wait 15 minutes before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate code and hash it for secure storage
    const code = generateCode();
    const hashedCode = await hashCode(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (type === 'registration' || type === 'password_reset') {
      // EFFICIENT O(1) LOOKUP: Direct query by email column with index
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, verification_code, email_verified')
        .eq('email', normalizedEmail)
        .maybeSingle();
      
      if (profileError) {
        console.error("Profile lookup error occurred");
        throw profileError;
      }

      if (type === 'registration') {
        // SECURITY: Always return success to prevent email enumeration
        if (!profile) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ success: true, message: "If an account exists, a verification code has been sent" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If auth already has the email confirmed, treat as already verified (no error)
        let authEmailConfirmed = false;
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);
          if (!userError && userData?.user?.email?.toLowerCase() === normalizedEmail) {
            authEmailConfirmed = !!userData.user.email_confirmed_at;
          }
        } catch (_e) {
          // ignore and continue with resend logic
        }

        if (authEmailConfirmed) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ success: true, alreadyVerified: true, message: "Email is already verified" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile with new hashed code (force a fresh verification code)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email_verified: false,
            verification_code: hashedCode,
            verification_code_expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', profile.user_id);

        if (updateError) throw updateError;

        // Send verification email with original (unhashed) code
        console.log("Sending verification email");
        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: 'user_verification',
            to: normalizedEmail,
            data: { code }, // Send original code in email
          }),
        });

        if (!sendEmailResponse.ok) {
          // SECURITY: Log failure without exposing email or response details
          console.error("Failed to send verification email");
        } else {
          console.log("Verification email sent successfully");
        }

      } else {
        // Password reset - SECURITY: Always return success to prevent email enumeration
        if (!profile) {
          console.log("No profile found for password reset");
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ success: true, message: "If an account exists, a reset code has been sent" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile with hashed reset code
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            password_reset_code: hashedCode,
            password_reset_expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', profile.user_id);

        if (updateError) throw updateError;

        // Send password reset email with original (unhashed) code
        console.log("Sending password reset email");
        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: 'password_reset',
            to: normalizedEmail,
            data: { code }, // Send original code in email
          }),
        });

        if (!sendEmailResponse.ok) {
          // SECURITY: Log failure without exposing email or response details
          console.error("Failed to send password reset email");
        } else {
          console.log("Password reset email sent successfully");
        }
      }

    } else if (type === 'affiliate') {
      // Affiliate lookup is already efficient - direct email query
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id, email')
        .eq('email', normalizedEmail)
        .maybeSingle();
      
      if (affiliateError) throw affiliateError;
      
      // SECURITY: Use consistent response to prevent affiliate enumeration
      if (!affiliate) {
        await addSecurityDelay(startTime);
        return new Response(
          JSON.stringify({ success: true, message: "If an affiliate account exists, a verification code has been sent" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update affiliate with hashed code
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          verification_token: hashedCode,
          verification_code_expires_at: expiresAt.toISOString(),
        })
        .eq('email', normalizedEmail);

      if (updateError) throw updateError;

      // Send affiliate verification email with original code
      console.log("Sending affiliate verification email");
      const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'affiliate_verification',
          to: normalizedEmail,
          data: { code }, // Send original code in email
        }),
      });
      
      if (!sendEmailResponse.ok) {
        // SECURITY: Log failure without exposing email or response details
        console.error("Failed to send affiliate verification email");
      } else {
        console.log("Affiliate verification email sent successfully");
      }
    }

    // Log this resend attempt for rate limiting using proper table
    await supabase
      .from('email_rate_limits')
      .insert({
        email: normalizedEmail,
        email_type: `resend_${type}`,
      });

    console.log("Verification code resend completed");

    return new Response(
      JSON.stringify({ success: true, message: "Verification code resent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    // SECURITY: Log error occurrence only, not details
    console.error("Error in resend-verification-code function");
    await addSecurityDelay(Date.now());
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
