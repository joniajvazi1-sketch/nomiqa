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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, type }: VerifyRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === 'registration' || type === 'password_reset') {
      // Get user by email from auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const user = authUser.users.find(u => u.email === email);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      if (type === 'registration') {
        // Verify registration code
        if (!profile.verification_code || profile.verification_code !== code) {
          return new Response(
            JSON.stringify({ error: "Invalid verification code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (new Date(profile.verification_code_expires_at) < new Date()) {
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
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true, message: "Email verified successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } else {
        // Verify password reset code
        if (!profile.password_reset_code || profile.password_reset_code !== code) {
          return new Response(
            JSON.stringify({ error: "Invalid reset code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (new Date(profile.password_reset_expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ error: "Reset code has expired" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Return success with token for password reset
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Code verified",
            resetToken: code,
            userId: user.id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

    } else if (type === 'affiliate') {
      // Verify affiliate code
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('email', email)
        .single();

      if (affiliateError || !affiliate) {
        return new Response(
          JSON.stringify({ error: "Affiliate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!affiliate.verification_token || affiliate.verification_token !== code) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (affiliate.verification_code_expires_at && new Date(affiliate.verification_code_expires_at) < new Date()) {
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

      // Send welcome email
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'affiliate_welcome',
          to: email,
          data: {
            username: affiliate.username || 'Affiliate',
            affiliateCode: affiliate.affiliate_code,
          },
        },
      });

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
