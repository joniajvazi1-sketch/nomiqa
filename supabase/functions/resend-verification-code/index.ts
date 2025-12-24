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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validationResult = resendRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Resend validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format",
          details: validationResult.error.issues 
        }),
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
      console.log(`Rate limit exceeded for resend to: ${normalizedEmail}`);
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
        console.error("Profile lookup error:", profileError);
        throw profileError;
      }

      if (type === 'registration') {
        // For registration resend, user must have a pending verification
        if (!profile) {
          console.log(`No profile found for email: ${normalizedEmail}`);
          return new Response(
            JSON.stringify({ error: "User not found or no pending verification" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (profile.email_verified) {
          return new Response(
            JSON.stringify({ error: "Email is already verified" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!profile.verification_code) {
          return new Response(
            JSON.stringify({ error: "No pending verification found" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile with new hashed code
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_code: hashedCode,
            verification_code_expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', profile.user_id);

        if (updateError) throw updateError;

        // Send verification email with original (unhashed) code
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
            data: { code }, // Send original code in email
          }),
        });
        
        if (!sendEmailResponse.ok) {
          const errorText = await sendEmailResponse.text();
          console.error(`Failed to send verification email: ${sendEmailResponse.status} - ${errorText}`);
        } else {
          console.log(`✓ Verification email sent to ${normalizedEmail}`);
        }

      } else {
        // Password reset
        if (!profile) {
          console.log(`No profile found for password reset: ${normalizedEmail}`);
          // Return success to prevent email enumeration attacks
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
        console.log(`Sending password reset email to ${normalizedEmail}`);
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
          const errorText = await sendEmailResponse.text();
          console.error(`Failed to send password reset email: ${sendEmailResponse.status} - ${errorText}`);
        } else {
          console.log(`✓ Password reset email sent to ${normalizedEmail}`);
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
      
      if (!affiliate) {
        return new Response(
          JSON.stringify({ error: "Affiliate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      console.log(`Sending affiliate verification email to ${normalizedEmail}`);
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
        const errorText = await sendEmailResponse.text();
        console.error(`Failed to send affiliate verification email: ${sendEmailResponse.status} - ${errorText}`);
      } else {
        console.log(`✓ Affiliate verification email sent to ${normalizedEmail}`);
      }
    }

    // Log this resend attempt for rate limiting using proper table
    await supabase
      .from('email_rate_limits')
      .insert({
        email: normalizedEmail,
        email_type: `resend_${type}`,
      });

    console.log(`Resent ${type} code to ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code resent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in resend-verification-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
