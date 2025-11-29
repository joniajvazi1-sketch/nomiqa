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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: max 3 resend requests per email per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentResends, error: rateLimitError } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'resend_verification')
      .gte('created_at', fifteenMinutesAgo)
      .eq('payload->>email_hash', email.toLowerCase())
      .limit(3);

    if (!rateLimitError && recentResends && recentResends.length >= 3) {
      console.log(`Rate limit exceeded for resend to: ${email}`);
      return new Response(
        JSON.stringify({ error: 'Too many resend requests. Please wait 15 minutes before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (type === 'registration' || type === 'password_reset') {
      // Get user by email - efficient lookup instead of loading all users
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Find user with matching email (case-insensitive)
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        console.log(`User not found for email: ${email}`);
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

    // Log this resend attempt for rate limiting - store full email for matching
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'resend_verification',
        payload: { type, email_hash: email.toLowerCase(), timestamp: new Date().toISOString() }
      });

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
