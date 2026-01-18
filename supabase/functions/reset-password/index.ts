import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const resetPasswordSchema = z.object({
  email: z.string().email().max(255),
  resetToken: z.string().min(6).max(10),
  newPassword: z.string().min(8).max(128),
});

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

// SECURITY: Generic error message to prevent enumeration
const GENERIC_AUTH_ERROR = "Password reset failed. Please check your credentials and try again.";

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(rawBody);
    if (!validationResult.success) {
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Invalid input format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { email, resetToken, newPassword } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash the submitted token to compare with stored hash
    const hashedToken = await hashCode(resetToken);

    // Efficient lookup: Find profile by hashed reset token
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, password_reset_code, password_reset_expires_at')
      .eq('password_reset_code', hashedToken)
      .limit(1);

    if (profileError) {
      // SECURITY: Log error without exposing details
      console.error("Profile lookup error occurred");
      throw new Error("Database error");
    }

    if (!profiles || profiles.length === 0) {
      // SECURITY: Log without exposing email
      console.log("Invalid reset token provided");
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = profiles[0];
    const userId = profile.user_id;

    // Verify email matches by checking auth.users for this user_id
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      // SECURITY: Log without exposing user details
      console.log("User lookup failed during password reset");
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userData.user.email?.toLowerCase() !== normalizedEmail) {
      // SECURITY: Log without exposing actual emails
      console.log("Email verification failed during password reset");
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: GENERIC_AUTH_ERROR }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (new Date(profile.password_reset_expires_at) < new Date()) {
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: "Reset code has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password using Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      // SECURITY: Log error occurrence only
      console.error("Password update error occurred");
      throw new Error("Password update failed");
    }

    // Clear reset token
    await supabase
      .from('profiles')
      .update({
        password_reset_code: null,
        password_reset_expires_at: null,
      })
      .eq('user_id', userId);

    // SECURITY: Log success without exposing user ID
    console.log("Password reset completed successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    // SECURITY: Log error occurrence only, not details
    console.error("Error in reset-password function");
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
