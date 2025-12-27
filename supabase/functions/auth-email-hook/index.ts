import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, any>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const generateAuthEmailHTML = (type: string, data: { email: string; confirmLink: string; token?: string }): { html: string; subject: string } => {
  const logoUrl = "https://nomiqa-esim.com/nomiqa-logo.jpg";
  const { email, confirmLink, token } = data;

  switch (type) {
    case 'recovery':
      return {
        subject: "Reset Your Nomiqa Password 🔐",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(6, 182, 212, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(6, 182, 212, 0.1);">
                    
                    <!-- Logo Section -->
                    <tr>
                      <td align="center" style="padding: 40px 40px 20px;">
                        <img src="${logoUrl}" alt="Nomiqa" style="width: 100px; height: 100px; border-radius: 20px; border: 2px solid #06b6d4; box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);" />
                      </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                      <td align="center" style="padding: 0 40px 10px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                          Password Reset Request
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 16px;">
                          We received a request to reset your password
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Email Badge -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <div style="display: inline-block; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 12px 24px;">
                          <span style="color: #67e8f9; font-size: 14px;">🔐 Account: ${email}</span>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Security Note -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 16px 24px;">
                          <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                            ⏱️ This link expires in 1 hour
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Alternative Link -->
                    <tr>
                      <td style="padding: 0 40px 30px;">
                        <p style="margin: 0 0 10px; color: #64748b; font-size: 13px;">If the button doesn't work, copy and paste this link:</p>
                        <p style="margin: 0; word-break: break-all; color: #06b6d4; font-size: 12px; background: rgba(6, 182, 212, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(6, 182, 212, 0.2);">${confirmLink}</p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-align: center;">
                          If you didn't request this, you can safely ignore this email.
                        </p>
                        <p style="margin: 0; color: #475569; font-size: 11px; text-align: center;">
                          © 2025 Nomiqa — Private. Borderless. Human.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

    case 'signup':
    case 'email_change':
    case 'invite':
      return {
        subject: "Confirm Your Nomiqa Account ✨",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(139, 92, 246, 0.1);">
                    
                    <!-- Logo Section -->
                    <tr>
                      <td align="center" style="padding: 40px 40px 20px;">
                        <img src="${logoUrl}" alt="Nomiqa" style="width: 100px; height: 100px; border-radius: 20px; border: 2px solid #8b5cf6; box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);" />
                      </td>
                    </tr>
                    
                    <!-- Welcome Badge -->
                    <tr>
                      <td align="center" style="padding: 0 40px 20px;">
                        <div style="display: inline-block; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 100px; padding: 8px 20px;">
                          <span style="color: #a855f7; font-size: 13px; font-weight: 600;">🎉 WELCOME TO NOMIQA</span>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                      <td align="center" style="padding: 0 40px 10px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                          Confirm Your Email
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 16px;">
                          Click below to verify your email and join the world's first<br/>community-owned DePIN mobile network
                        </p>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);">
                          Confirm Email
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Benefits -->
                    <tr>
                      <td style="padding: 0 40px 30px;">
                        <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 20px;">
                          <p style="margin: 0 0 12px; color: #c084fc; font-weight: 600; font-size: 14px;">✨ Your Early Member Benefits:</p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">✓ Global eSIM coverage in 200+ countries</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">✓ Earn crypto rewards with every purchase</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">✓ Priority access to $NOMI token airdrop</td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Alternative Link -->
                    <tr>
                      <td style="padding: 0 40px 30px;">
                        <p style="margin: 0 0 10px; color: #64748b; font-size: 13px;">If the button doesn't work, copy and paste this link:</p>
                        <p style="margin: 0; word-break: break-all; color: #8b5cf6; font-size: 12px; background: rgba(139, 92, 246, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.2);">${confirmLink}</p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-align: center;">
                          If you didn't create this account, you can safely ignore this email.
                        </p>
                        <p style="margin: 0; color: #475569; font-size: 11px; text-align: center;">
                          © 2025 Nomiqa — Private. Borderless. Human.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

    case 'magiclink':
      return {
        subject: "Your Nomiqa Magic Link ✨",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(16, 185, 129, 0.1);">
                    
                    <!-- Logo Section -->
                    <tr>
                      <td align="center" style="padding: 40px 40px 20px;">
                        <img src="${logoUrl}" alt="Nomiqa" style="width: 100px; height: 100px; border-radius: 20px; border: 2px solid #10b981; box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);" />
                      </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                      <td align="center" style="padding: 0 40px 10px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                          Sign In to Nomiqa
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 16px;">
                          Click the magic link below to sign in instantly
                        </p>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);">
                          ✨ Sign In Now
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Security Note -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 16px 24px;">
                          <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                            ⏱️ This link expires in 1 hour
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Alternative Link -->
                    <tr>
                      <td style="padding: 0 40px 30px;">
                        <p style="margin: 0 0 10px; color: #64748b; font-size: 13px;">If the button doesn't work, copy and paste this link:</p>
                        <p style="margin: 0; word-break: break-all; color: #10b981; font-size: 12px; background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">${confirmLink}</p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-align: center;">
                          If you didn't request this, you can safely ignore this email.
                        </p>
                        <p style="margin: 0; color: #475569; font-size: 11px; text-align: center;">
                          © 2025 Nomiqa — Private. Borderless. Human.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Nomiqa Account Notification",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(6, 182, 212, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    
                    <tr>
                      <td align="center" style="padding: 40px 40px 20px;">
                        <img src="${logoUrl}" alt="Nomiqa" style="width: 100px; height: 100px; border-radius: 20px; border: 2px solid #06b6d4; box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);" />
                      </td>
                    </tr>
                    
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <h1 style="margin: 0; font-size: 24px; color: #f1f5f9;">Nomiqa Notification</h1>
                        <p style="margin: 15px 0 0; color: #94a3b8; font-size: 16px;">Click below to continue:</p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td align="center" style="padding: 0 40px 40px;">
                        <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                          Continue
                        </a>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="margin: 0; color: #475569; font-size: 11px; text-align: center;">
                          © 2025 Nomiqa — Private. Borderless. Human.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as AuthEmailPayload;
    
    console.log("Auth email hook triggered:", {
      email: payload.user?.email?.replace(/(.{2}).*@/, '$1***@'),
      type: payload.email_data?.email_action_type
    });

    const { user, email_data } = payload;
    
    if (!user?.email || !email_data) {
      console.error("Invalid payload - missing user email or email_data");
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    
    // Construct the confirmation link
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || email_data.site_url)}`;

    const { html, subject } = generateAuthEmailHTML(email_data.email_action_type, {
      email: user.email,
      confirmLink,
      token: email_data.token
    });

    const emailResponse = await resend.emails.send({
      from: "Nomiqa <support@nomiqa-esim.com>",
      to: [user.email],
      subject,
      html,
    });

    console.log("Custom auth email sent successfully:", { 
      id: emailResponse.data?.id, 
      type: email_data.email_action_type 
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in auth-email-hook function:", error);
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
