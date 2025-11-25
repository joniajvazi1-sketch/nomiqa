import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendRequest {
  email: string;
  type: 'registration' | 'password_reset' | 'affiliate';
}

// Generate 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type }: ResendRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (type === 'registration' || type === 'password_reset') {
      // Get user by email
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const user = authUser.users.find(u => u.email === email);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (type === 'registration') {
        // Update profile with new code
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_code: code,
            verification_code_expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Send verification email
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'user_verification',
            to: email,
            data: { code },
          },
        });

      } else {
        // Update profile with reset code
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            password_reset_code: code,
            password_reset_expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Send password reset email
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'password_reset',
            to: email,
            data: { code },
          },
        });
      }

    } else if (type === 'affiliate') {
      // Update affiliate with new code
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          verification_token: code,
          verification_code_expires_at: expiresAt.toISOString(),
        })
        .eq('email', email);

      if (updateError) throw updateError;

      // Send affiliate verification email
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'affiliate_verification',
          to: email,
          data: { code },
        },
      });
    }

    console.log(`Resent ${type} code to ${email}`);

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
