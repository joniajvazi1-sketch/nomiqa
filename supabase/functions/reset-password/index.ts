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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }),
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

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      console.log(`Invalid reset token provided for email: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid reset token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = profiles[0];
    const userId = profile.user_id;

    // Verify email matches by checking auth.users for this user_id
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      console.log(`User not found for id: ${userId}`);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userData.user.email?.toLowerCase() !== normalizedEmail) {
      console.log(`Email mismatch: provided ${normalizedEmail}, actual ${userData.user.email}`);
      return new Response(
        JSON.stringify({ error: "Email mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (new Date(profile.password_reset_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Reset token has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password using Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Clear reset token
    await supabase
      .from('profiles')
      .update({
        password_reset_code: null,
        password_reset_expires_at: null,
      })
      .eq('user_id', userId);

    console.log(`Password reset successfully for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in reset-password function:", error);
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
