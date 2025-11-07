import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("AUTH_EMAIL_HOOK_SECRET") as string;

serve(async (req) => {
  console.log("Auth email hook triggered");

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook if secret is configured
    let webhookData;
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      webhookData = wh.verify(payload, headers);
    } else {
      webhookData = JSON.parse(payload);
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = webhookData as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log(`Sending ${email_action_type} email to ${user.email}`);

    // Build confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Render the React email template
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        confirmationUrl,
      })
    );

    // Send email via Resend with Nomiqa branding
    const { data, error } = await resend.emails.send({
      from: "Nomiqa <onboarding@resend.dev>", // Change to your verified domain
      to: [user.email],
      subject: "Welcome to Nomiqa - Activate Your Account",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending auth email:", error);
    
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
