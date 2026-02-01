import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
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
    token_new?: string;
    token_hash_new?: string;
  };
}

const generateAuthEmailHTML = (type: string, data: { email: string; confirmLink: string; token: string; siteUrl: string }): { html: string; subject: string } => {
  const logoUrl = "https://nomiqa-depin.com/nomiqa-header-logo.png";
  const { email, confirmLink, token, siteUrl } = data;

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
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #22d3ee;">
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
                    
                    <!-- OTP Code Box -->
                    <tr>
                      <td align="center" style="padding: 0 40px 20px;">
                        <div style="background: rgba(6, 182, 212, 0.1); border: 2px solid rgba(6, 182, 212, 0.4); border-radius: 16px; padding: 24px;">
                          <p style="margin: 0 0 12px; color: #67e8f9; font-size: 14px; font-weight: 600;">YOUR RESET CODE</p>
                          <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #22d3ee; font-family: 'Courier New', monospace;">${token}</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- OR Divider -->
                    <tr>
                      <td align="center" style="padding: 10px 40px;">
                        <p style="margin: 0; color: #64748b; font-size: 14px;">— OR —</p>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td align="center" style="padding: 10px 40px 30px;">
                        <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Security Note -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 16px 24px;">
                          <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                            ⏱️ This code expires in 1 hour
                          </p>
                        </div>
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
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #a855f7;">
                          Confirm Your Email
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 16px;">
                          Use the code below to verify your email
                        </p>
                      </td>
                    </tr>
                    
                    <!-- OTP Code Box -->
                    <tr>
                      <td align="center" style="padding: 0 40px 20px;">
                        <div style="background: rgba(139, 92, 246, 0.1); border: 2px solid rgba(139, 92, 246, 0.4); border-radius: 16px; padding: 24px;">
                          <p style="margin: 0 0 12px; color: #c084fc; font-size: 14px; font-weight: 600;">YOUR VERIFICATION CODE</p>
                          <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #a855f7; font-family: 'Courier New', monospace;">${token}</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- OR Divider -->
                    <tr>
                      <td align="center" style="padding: 10px 40px;">
                        <p style="margin: 0; color: #64748b; font-size: 14px;">— OR —</p>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td align="center" style="padding: 10px 40px 30px;">
                        <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);">
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
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #34d399;">
                          Sign In to Nomiqa
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 16px;">
                          Use your magic code or click the button below
                        </p>
                      </td>
                    </tr>
                    
                    <!-- OTP Code Box -->
                    <tr>
                      <td align="center" style="padding: 0 40px 20px;">
                        <div style="background: rgba(16, 185, 129, 0.1); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 16px; padding: 24px;">
                          <p style="margin: 0 0 12px; color: #6ee7b7; font-size: 14px; font-weight: 600;">YOUR MAGIC CODE</p>
                          <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #34d399; font-family: 'Courier New', monospace;">${token}</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- OR Divider -->
                    <tr>
                      <td align="center" style="padding: 10px 40px;">
                        <p style="margin: 0; color: #64748b; font-size: 14px;">— OR —</p>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td align="center" style="padding: 10px 40px 30px;">
                        <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);">
                          ✨ Sign In Now
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Security Note -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px;">
                        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 16px 24px;">
                          <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                            ⏱️ This code expires in 1 hour
                          </p>
                        </div>
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
                      <td align="center" style="padding: 0 40px 20px;">
                        <h1 style="margin: 0; font-size: 24px; color: #f1f5f9;">Nomiqa Notification</h1>
                      </td>
                    </tr>
                    
                    <!-- OTP Code Box -->
                    <tr>
                      <td align="center" style="padding: 0 40px 20px;">
                        <div style="background: rgba(6, 182, 212, 0.1); border: 2px solid rgba(6, 182, 212, 0.4); border-radius: 16px; padding: 24px;">
                          <p style="margin: 0 0 12px; color: #67e8f9; font-size: 14px; font-weight: 600;">YOUR CODE</p>
                          <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #22d3ee; font-family: 'Courier New', monospace;">${token}</p>
                        </div>
                      </td>
                    </tr>
                    
                    <tr>
                      <td align="center" style="padding: 10px 40px 40px;">
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
    // Parse the request body - Supabase Auth sends JSON directly
    const data: AuthEmailPayload = await req.json();
    
    console.log("Auth email hook triggered:", {
      email: data.user?.email?.replace(/(.{2}).*@/, '$1***@'),
      type: data.email_data?.email_action_type
    });

    const { user, email_data } = data;
    
    if (!user?.email || !email_data) {
      console.error("Invalid payload - missing user email or email_data");
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    
    // Construct the confirmation link
    const redirectTo = email_data.redirect_to || email_data.site_url || supabaseUrl;
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(redirectTo)}`;

    const { html, subject } = generateAuthEmailHTML(email_data.email_action_type, {
      email: user.email,
      confirmLink,
      token: email_data.token,
      siteUrl: email_data.site_url
    });

    const emailResponse = await resend.emails.send({
      from: "Nomiqa <support@nomiqa-esim.com>",
      to: [user.email],
      subject,
      html,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Custom auth email sent successfully:", { 
      id: emailResponse.data?.id, 
      type: email_data.email_action_type 
    });

    // Return empty object to indicate success to Supabase
    return new Response(
      JSON.stringify({}),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in auth-email-hook function:", error);
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: 500,
          message: error.message 
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
