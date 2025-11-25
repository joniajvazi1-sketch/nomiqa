import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'user_verification' | 'password_reset' | 'affiliate_verification' | 'order_confirmation' | 'affiliate_welcome' | 'tier_upgrade';
  to: string;
  language?: string;
  data: Record<string, any>;
}

const generateEmailHTML = (type: string, data: any): { html: string; subject: string } => {
  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        margin: 0; 
        padding: 0;
        width: 100%;
      }
      .email-wrapper {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        padding: 60px 20px;
        width: 100%;
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(40px);
        border-radius: 32px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 56px 48px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1) inset;
      }
      .logo-section { 
        text-align: center; 
        margin-bottom: 48px; 
      }
      .logo-section img { 
        width: 140px; 
        height: 140px; 
        border-radius: 28px; 
        border: 3px solid rgba(139, 92, 246, 0.4);
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
      }
      h1 { 
        background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 36px;
        font-weight: 800;
        text-align: center;
        margin: 0 0 20px 0;
        letter-spacing: -0.5px;
      }
      .subtitle {
        color: #cbd5e1;
        font-size: 17px;
        line-height: 28px;
        text-align: center;
        margin: 0 0 40px 0;
      }
      .code-container {
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
        border: 2px solid rgba(139, 92, 246, 0.25);
        border-radius: 20px;
        padding: 40px 32px;
        margin: 40px 0;
        text-align: center;
        box-shadow: 0 0 50px rgba(139, 92, 246, 0.15);
      }
      .code-display {
        font-size: 56px;
        font-weight: 900;
        letter-spacing: 16px;
        background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
        text-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
      }
      .info-box {
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 16px;
        padding: 20px 24px;
        margin: 28px 0;
        text-align: center;
      }
      .info-box p {
        color: #fca5a5;
        font-size: 15px;
        font-weight: 600;
        margin: 0;
      }
      .success-box {
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 16px;
        padding: 24px;
        margin: 28px 0;
        text-align: center;
      }
      .success-box .title {
        color: #6ee7b7;
        font-size: 16px;
        font-weight: 700;
        margin: 0 0 10px 0;
      }
      .success-box .text {
        color: #a7f3d0;
        font-size: 14px;
        margin: 0;
      }
      .details-card {
        background: rgba(6, 182, 212, 0.06);
        border: 1px solid rgba(6, 182, 212, 0.15);
        border-radius: 20px;
        padding: 32px 28px;
        margin: 32px 0;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
      .detail-label {
        color: #94a3b8;
        font-size: 15px;
      }
      .detail-value {
        color: #e2e8f0;
        font-size: 16px;
        font-weight: 700;
      }
      .total-row {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 2px solid rgba(139, 92, 246, 0.2);
      }
      .total-label {
        color: #cbd5e1;
        font-size: 17px;
        font-weight: 700;
      }
      .total-value {
        font-size: 32px;
        font-weight: 900;
        background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
        color: white;
        text-decoration: none;
        padding: 18px 48px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 17px;
        text-align: center;
        margin: 32px auto;
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
      }
      .text-muted {
        color: #94a3b8;
        font-size: 15px;
        line-height: 26px;
        text-align: center;
        margin: 28px 0 0 0;
      }
      .footer {
        text-align: center;
        margin-top: 48px;
        padding-top: 32px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .footer-text {
        color: #64748b;
        font-size: 14px;
        margin: 0 0 8px 0;
        font-weight: 600;
      }
      .footer-subtext {
        color: #475569;
        font-size: 13px;
        margin: 0;
      }
      @media only screen and (max-width: 600px) {
        .container { padding: 40px 28px; }
        h1 { font-size: 28px; }
        .code-display { font-size: 44px; letter-spacing: 12px; }
        .cta-button { padding: 16px 36px; font-size: 16px; }
      }
    </style>
  `;

  const logoSrc = "https://nomiqa-esim.com/nomiqa-logo.jpg";

  switch (type) {
    case 'user_verification':
      return {
        subject: "Verify Your Nomiqa Account ✨",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${baseStyle}
            </head>
            <body>
              <div class="email-wrapper">
                <div class="container">
                  <div class="logo-section">
                    <img src="${logoSrc}" alt="Nomiqa" />
                  </div>
                  <h1>Welcome to Nomiqa!</h1>
                  <p class="subtitle">Your account has been created. Enter this verification code to activate your account and start your journey:</p>
                  <div class="code-container">
                    <div class="code-display">${data.code}</div>
                  </div>
                  <div class="info-box">
                    <p>⏱️ This code expires in 15 minutes</p>
                  </div>
                  <p class="text-muted">If you didn't create this account, you can safely ignore this email.</p>
                  <div class="footer">
                    <p class="footer-text">© 2025 Nomiqa</p>
                    <p class="footer-subtext">Private. Borderless. Human.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'password_reset':
      return {
        subject: "Reset Your Nomiqa Password 🔐",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${baseStyle}
            </head>
            <body>
              <div class="email-wrapper">
                <div class="container">
                  <div class="logo-section">
                    <img src="${logoSrc}" alt="Nomiqa" />
                  </div>
                  <h1>Reset Your Password</h1>
                  <p class="subtitle">We received a request to reset your password. Use this code to create a new password:</p>
                  <div class="code-container">
                    <div class="code-display">${data.code}</div>
                  </div>
                  <div class="info-box">
                    <p>⏱️ This code expires in 15 minutes</p>
                  </div>
                  <p class="text-muted">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
                  <div class="footer">
                    <p class="footer-text">© 2025 Nomiqa</p>
                    <p class="footer-subtext">Private. Borderless. Human.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'affiliate_verification':
      return {
        subject: "Start Earning with Nomiqa 💰",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${baseStyle}
            </head>
            <body>
              <div class="email-wrapper">
                <div class="container">
                  <div class="logo-section">
                    <img src="${logoSrc}" alt="Nomiqa" />
                  </div>
                  <h1>Start Earning Today!</h1>
                  <p class="subtitle">Your affiliate account is almost ready. Verify your email to start earning real crypto:</p>
                  <div class="code-container">
                    <div class="code-display">${data.code}</div>
                  </div>
                  <div class="success-box">
                    <p class="title">💰 Earn Real Crypto (USDC & SOL)</p>
                    <p class="text">9% direct + 6% tier 2 + 3% tier 3 commission</p>
                  </div>
                  <div class="info-box">
                    <p>⏱️ Code expires in 15 minutes</p>
                  </div>
                  <div class="footer">
                    <p class="footer-text">© 2025 Nomiqa</p>
                    <p class="footer-subtext">Private. Borderless. Human.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'order_confirmation':
      return {
        subject: "Your Nomiqa eSIM is Ready! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${baseStyle}
            </head>
            <body>
              <div class="email-wrapper">
                <div class="container">
                  <div class="logo-section">
                    <img src="${logoSrc}" alt="Nomiqa" />
                  </div>
                  <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 72px; margin-bottom: 20px;">🎉</div>
                    <h1>Order Confirmed!</h1>
                    <p class="subtitle">Your eSIM is ready to activate</p>
                  </div>
                  <div class="details-card">
                    <div class="detail-row">
                      <span class="detail-label">Country</span>
                      <span class="detail-value">${data.country}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Data</span>
                      <span class="detail-value">${data.dataAmount}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Validity</span>
                      <span class="detail-value">${data.validity} days</span>
                    </div>
                    <div class="detail-row total-row">
                      <span class="total-label">Total Paid</span>
                      <span class="total-value">$${data.price}</span>
                    </div>
                  </div>
                  <div class="success-box">
                    <p class="title">✨ Next Steps</p>
                    <p class="text">Check your account to view activation instructions and QR code</p>
                  </div>
                  <div style="text-align: center;">
                    <a href="https://nomiqa-esim.com/my-account" class="cta-button">View My eSIMs</a>
                  </div>
                  <div class="footer">
                    <p class="footer-text">© 2025 Nomiqa</p>
                    <p class="footer-subtext">Need help? Visit nomiqa-esim.com/help</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'affiliate_welcome':
      return {
        subject: "Welcome to Nomiqa Affiliate! 🚀",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${baseStyle}
            </head>
            <body>
              <div class="email-wrapper">
                <div class="container">
                  <div class="logo-section">
                    <img src="${logoSrc}" alt="Nomiqa" />
                  </div>
                  <div style="text-align: center; margin-bottom: 32px;">
                    <div style="font-size: 72px; margin-bottom: 20px;">🚀</div>
                    <h1>Welcome, ${data.username}!</h1>
                    <p class="subtitle">Your affiliate account is now active</p>
                  </div>
                  <div style="background: rgba(139, 92, 246, 0.08); border: 2px solid rgba(139, 92, 246, 0.3); border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center;">
                    <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 12px; font-weight: 600;">Your Affiliate Code</p>
                    <p style="color: #06b6d4; font-size: 32px; font-weight: 800; letter-spacing: 3px; text-shadow: 0 0 30px rgba(6, 182, 212, 0.5); font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;">${data.affiliateCode}</p>
                  </div>
                  <div class="success-box" style="padding: 32px 28px;">
                    <p class="title" style="font-size: 18px; margin-bottom: 16px;">💰 Earn REAL Crypto (Not Vouchers!)</p>
                    <p style="color: #a7f3d0; font-size: 15px; margin: 10px 0; font-weight: 600;">✓ 9% direct referral commission</p>
                    <p style="color: #a7f3d0; font-size: 15px; margin: 10px 0; font-weight: 600;">✓ 6% tier 2 passive income</p>
                    <p style="color: #a7f3d0; font-size: 15px; margin: 10px 0; font-weight: 600;">✓ 3% tier 3 passive income</p>
                    <p style="color: #6ee7b7; font-size: 13px; margin-top: 16px; font-style: italic;">Paid in USDC & SOL directly to your wallet</p>
                  </div>
                  <div style="text-align: center;">
                    <a href="https://nomiqa-esim.com/affiliate" class="cta-button">Visit Dashboard</a>
                  </div>
                  <div class="footer">
                    <p class="footer-text">© 2025 Nomiqa</p>
                    <p class="footer-subtext">Private. Borderless. Human.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case 'tier_upgrade':
      const tierEmojis: Record<string, string> = {
        beginner: "🥉",
        traveler: "🥈",
        adventurer: "🥇",
        explorer: "💎",
      };
      const tierName = data.tier.charAt(0).toUpperCase() + data.tier.slice(1);
      return {
        subject: `🎉 You've Unlocked ${tierName}!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              ${baseStyle}
            </head>
            <body>
              <div class="email-wrapper">
                <div class="container">
                  <div class="logo-section">
                    <img src="${logoSrc}" alt="Nomiqa" />
                  </div>
                  <div style="text-align: center; margin-bottom: 40px;">
                    <div style="font-size: 88px; margin-bottom: 24px;">${tierEmojis[data.tier.toLowerCase()] || "✨"}</div>
                    <h1 style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Congratulations!</h1>
                    <p class="subtitle" style="font-size: 19px; font-weight: 600; color: #e2e8f0;">${data.username}</p>
                  </div>
                  <div style="background: rgba(139, 92, 246, 0.08); border: 3px solid rgba(139, 92, 246, 0.3); border-radius: 24px; padding: 40px 32px; margin: 32px 0; text-align: center; box-shadow: 0 0 50px rgba(139, 92, 246, 0.25);">
                    <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 16px; font-weight: 600; letter-spacing: 0.5px;">YOU'VE UNLOCKED</p>
                    <p style="color: #06b6d4; font-size: 44px; font-weight: 900; text-shadow: 0 0 40px rgba(6, 182, 212, 0.5); letter-spacing: -0.5px;">${tierName}</p>
                  </div>
                  <div style="background: rgba(16, 185, 129, 0.08); border: 2px solid rgba(16, 185, 129, 0.25); border-radius: 20px; padding: 40px 32px; margin: 32px 0; text-align: center;">
                    <p style="color: #a7f3d0; font-size: 15px; margin-bottom: 12px; font-weight: 600;">NEW CASHBACK RATE</p>
                    <p style="color: #6ee7b7; font-size: 64px; font-weight: 900; line-height: 1;">${data.cashbackRate}%</p>
                    <p style="color: #d1fae5; font-size: 16px; margin-top: 16px; font-weight: 600;">on all eSIM purchases!</p>
                  </div>
                  <p class="subtitle" style="font-size: 17px; line-height: 30px; text-align: center; margin: 32px 0;">
                    Thank you for being a valued member of the Nomiqa community. Your journey continues!
                  </p>
                  <div class="footer">
                    <p class="footer-text">© 2025 Nomiqa</p>
                    <p class="footer-subtext">Private. Borderless. Human.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, language = 'en', data }: EmailRequest = await req.json();

    const { html, subject } = generateEmailHTML(type, data);

    const emailResponse = await resend.emails.send({
      from: "Nomiqa <support@nomiqa-esim.com>",
      to: [to],
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to}:`, emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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
