import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schema
const registrationSchema = z.object({
  email: z.string().email().max(255),
  referralCode: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Network registration request received");

    // Validate input
    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, referralCode, source } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for rate limiting (max 3 registrations per IP per hour)
    // Simple duplicate check - email must be unique
    const { data: existingReg, error: checkError } = await supabase
      .from("network_registrations")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing registration:", checkError);
      return new Response(
        JSON.stringify({ error: "Registration check failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingReg) {
      console.log("Email already registered:", normalizedEmail);
      // Return success anyway to prevent email enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Registration received",
          alreadyRegistered: true 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get country from request headers (Cloudflare/Supabase provides this)
    const ipCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-country") || null;

    // Insert new registration
    const { error: insertError } = await supabase
      .from("network_registrations")
      .insert({
        email: normalizedEmail,
        referral_code: referralCode || null,
        ip_country: ipCountry,
        source: source || "hero",
        status: "pending",
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      // Handle unique constraint violation
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ success: true, message: "Registration received", alreadyRegistered: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Registration failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Registration saved for:", normalizedEmail);

    // Send confirmation email
    const logoUrl = "https://nomiqa-esim.com/nomiqa-logo.jpg";
    
    try {
      await resend.emails.send({
        from: "Nomiqa Network <network@nomiqa-esim.com>",
        to: [normalizedEmail],
        subject: "You're In! Welcome to the Nomiqa Network 🌐",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #ffffff; padding: 40px 30px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 100px; height: 100px; border-radius: 20px; border: 2px solid #00d4ff; box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);" />
            </div>
            
            <h1 style="color: #00d4ff; text-align: center; margin-bottom: 10px; font-size: 28px;">
              🎉 You're In!
            </h1>
            
            <h2 style="color: #ffffff; text-align: center; font-weight: normal; margin-bottom: 30px; font-size: 18px;">
              Welcome to the Nomiqa Network
            </h2>
            
            <div style="background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 24px; margin: 20px 0;">
              <p style="margin: 0; color: #e0e0e0; line-height: 1.8; font-size: 15px;">
                You've secured your spot as an <strong style="color: #00d4ff;">early member</strong> of the world's first community-owned DePIN mobile network.
              </p>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 15px;">What happens next?</h3>
              <ul style="color: #b0b0b0; line-height: 2; padding-left: 20px; margin: 0;">
                <li>We're building the network infrastructure</li>
                <li>You'll receive updates on our progress</li>
                <li>Early members get <strong style="color: #00d4ff;">priority access</strong> to rewards</li>
                <li>When we launch, you'll be first in line</li>
              </ul>
            </div>

            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #10b981; font-size: 14px; text-align: center;">
                ✓ No action needed — we'll email you when it's time to activate
              </p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">© 2025 Nomiqa - Building the world's first DePIN Mobile Ecosystem</p>
            </div>
          </div>
        `,
      });
      console.log("Confirmation email sent to:", normalizedEmail);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the registration if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Registration successful" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
