import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
  type: 'registration' | 'password_reset' | 'affiliate';
}

// Hash a code using SHA-256
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// SECURITY: Add artificial delay to mitigate timing attacks
// This ensures all verification attempts take similar time regardless of validity
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
    const { email, code, type }: VerifyRequest = await req.json();
    
    // Validate inputs
    if (!email || !code || !type) {
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedEmail = email.toLowerCase().trim();
    
    // Hash the submitted code to compare with stored hash
    const hashedCode = await hashCode(code);

    if (type === 'registration' || type === 'password_reset') {
      let profile;
      let userId: string | null = null;
      
      if (type === 'registration') {
        // Find profile with matching hashed verification code
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('verification_code', hashedCode)
          .limit(1);
        
        if (profileError) throw profileError;
        
        if (!profiles || profiles.length === 0) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ error: "Invalid verification code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        profile = profiles[0];
        userId = profile.user_id;
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Invalid profile data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Verify email matches by checking auth.users for this user_id
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user || userData.user.email?.toLowerCase() !== normalizedEmail) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ error: "Email mismatch or user not found" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Check expiration
        if (new Date(profile.verification_code_expires_at) < new Date()) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ error: "Verification code has expired" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email_verified: true,
            verification_code: null,
            verification_code_expires_at: null,
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        // Send early member welcome email
        console.log(`Sending early member welcome email to ${normalizedEmail}`);
        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: 'early_member_welcome',
            to: normalizedEmail,
            data: {
              username: profile.username || 'Early Member',
            },
          }),
        });
        
        if (!sendEmailResponse.ok) {
          const errorText = await sendEmailResponse.text();
          console.error(`Failed to send early member welcome email: ${sendEmailResponse.status} - ${errorText}`);
        } else {
          console.log(`✓ Early member welcome email sent to ${normalizedEmail}`);
        }

        console.log(`Email verified for user ${userId}`);
        return new Response(
          JSON.stringify({ success: true, message: "Email verified successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } else {
        // Password reset - find profile with matching hashed reset code
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('password_reset_code', hashedCode)
          .limit(1);
        
        if (profileError) throw profileError;
        
        if (!profiles || profiles.length === 0) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ error: "Invalid reset code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        profile = profiles[0];
        userId = profile.user_id;
        
        if (!userId) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ error: "Invalid profile data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Verify email matches by checking auth.users for this user_id
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user || userData.user.email?.toLowerCase() !== normalizedEmail) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ error: "Email mismatch or user not found" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check expiration
        if (new Date(profile.password_reset_expires_at) < new Date()) {
          await addSecurityDelay(startTime);
          return new Response(
            JSON.stringify({ error: "Reset code has expired" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Return success with the original code (not hash) for password reset flow
        // The code acts as a short-lived token for the next step
        console.log(`Password reset code verified for user ${userId}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Code verified",
            resetToken: code,
            userId: userId,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

    } else if (type === 'affiliate') {
      // Verify affiliate code - efficient direct lookup by email
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

      if (affiliateError || !affiliate) {
        await addSecurityDelay(startTime);
        return new Response(
          JSON.stringify({ error: "Affiliate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash submitted code and compare with stored hash
      if (!affiliate.verification_token || affiliate.verification_token !== hashedCode) {
        await addSecurityDelay(startTime);
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (affiliate.verification_code_expires_at && new Date(affiliate.verification_code_expires_at) < new Date()) {
        await addSecurityDelay(startTime);
        return new Response(
          JSON.stringify({ error: "Verification code has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update affiliate
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          email_verified: true,
          verification_token: null,
          verification_code_expires_at: null,
          status: 'active',
        })
        .eq('id', affiliate.id);

      if (updateError) throw updateError;

      // Send welcome email using direct HTTP call
      console.log(`Sending affiliate welcome email to ${normalizedEmail}`);
      const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'affiliate_welcome',
          to: normalizedEmail,
          data: {
            username: affiliate.username || 'Affiliate',
            affiliateCode: affiliate.affiliate_code,
          },
        }),
      });
      
      if (!sendEmailResponse.ok) {
        const errorText = await sendEmailResponse.text();
        console.error(`Failed to send affiliate welcome email: ${sendEmailResponse.status} - ${errorText}`);
      } else {
        console.log(`✓ Affiliate welcome email sent to ${normalizedEmail}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Affiliate verified successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid verification type");

  } catch (error: any) {
    console.error("Error in verify-email-code function:", error);
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
