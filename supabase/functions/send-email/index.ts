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
      body { 
        background-color: #0a0118; 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        margin: 0; 
        padding: 40px 20px;
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: linear-gradient(180deg, rgba(155, 135, 245, 0.05) 0%, rgba(0, 229, 255, 0.05) 100%);
        border-radius: 16px;
        border: 1px solid rgba(155, 135, 245, 0.2);
        padding: 40px;
      }
      .logo { 
        text-align: center; 
        margin-bottom: 32px; 
      }
      .logo img { 
        width: 120px; 
        height: 120px; 
        border-radius: 50%; 
        border: 3px solid #9b87f5; 
      }
      h1 { 
        background: linear-gradient(135deg, #00e5ff 0%, #9b87f5 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 32px;
        font-weight: 700;
        text-align: center;
        margin: 30px 0;
      }
      .code-section {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin: 40px 0;
        padding: 30px 20px;
        background: rgba(155, 135, 245, 0.1);
        border-radius: 16px;
        border: 1px solid rgba(155, 135, 245, 0.3);
      }
      .code-digit {
        display: inline-block;
        width: 50px;
        height: 60px;
        line-height: 60px;
        font-size: 28px;
        font-weight: 700;
        color: #00e5ff;
        background: rgba(0, 229, 255, 0.1);
        border: 2px solid #00e5ff;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
      }
      .text { 
        color: #e0e0e0; 
        font-size: 16px; 
        line-height: 26px; 
        text-align: center; 
      }
      .footer { 
        color: #9b87f5; 
        font-size: 14px; 
        text-align: center; 
        margin-top: 40px; 
        font-weight: 500; 
      }
      .warning {
        color: #fbbf24;
        font-size: 15px;
        text-align: center;
        margin: 24px 0;
        font-weight: 600;
        padding: 12px;
        background: rgba(251, 191, 36, 0.1);
        border-radius: 8px;
      }
    </style>
  `;

  const logoSrc = "https://gzhmbiopiciugriatsdb.supabase.co/storage/v1/object/public/public-assets/nomiqa-logo.jpg";

  switch (type) {
    case 'user_verification':
      return {
        subject: `Your Nomiqa Verification Code: ${data.code}`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="logo"><img src="${logoSrc}" alt="Nomiqa" /></div>
            <h1>Verify Your Email</h1>
            <p class="text">Enter this code to complete your registration:</p>
            <div class="code-section">
              ${data.code.split('').map((d: string) => `<span class="code-digit">${d}</span>`).join('')}
            </div>
            <p class="text" style="color: #fbbf24; font-size: 14px;">This code expires in 15 minutes</p>
            <p class="text" style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
              If you didn't request this, please ignore this email.
            </p>
            <p class="footer">Private. Borderless. Human.</p>
          </div>
        `,
      };

    case 'password_reset':
      return {
        subject: `Reset Your Nomiqa Password: ${data.code}`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="logo"><img src="${logoSrc}" alt="Nomiqa" /></div>
            <h1 style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Reset Your Password</h1>
            <p class="text">Enter this code to reset your password:</p>
            <div class="code-section" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
              ${data.code.split('').map((d: string) => `<span class="code-digit" style="color: #ef4444; border-color: #ef4444; background: rgba(239, 68, 68, 0.1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);">${d}</span>`).join('')}
            </div>
            <p class="warning">⚠️ Never share this code with anyone</p>
            <p class="text" style="color: #fbbf24; font-size: 14px;">This code expires in 15 minutes</p>
            <p class="text" style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
              If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
            <p class="footer">Private. Borderless. Human.</p>
          </div>
        `,
      };

    case 'affiliate_verification':
      return {
        subject: `Verify Your Nomiqa Affiliate Account: ${data.code}`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="logo"><img src="${logoSrc}" alt="Nomiqa" /></div>
            <h1>Verify Your Affiliate Account</h1>
            <p class="text">Enter this code to activate your affiliate account:</p>
            <div class="code-section">
              ${data.code.split('').map((d: string) => `<span class="code-digit">${d}</span>`).join('')}
            </div>
            <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; padding: 24px; margin: 32px 0;">
              <p class="text" style="font-weight: 600; margin-bottom: 16px;">Start earning REAL crypto (USDC & SOL) with our 3-tier commission system:</p>
              <p class="text" style="color: #00e5ff; font-size: 14px; margin-bottom: 8px;">✓ 9% direct referral commission</p>
              <p class="text" style="color: #00e5ff; font-size: 14px; margin-bottom: 8px;">✓ 6% tier 2 passive income</p>
              <p class="text" style="color: #00e5ff; font-size: 14px;">✓ 3% tier 3 passive income</p>
            </div>
            <p class="text" style="color: #fbbf24; font-size: 14px;">This code expires in 15 minutes</p>
            <p class="footer">Private. Borderless. Human.</p>
          </div>
        `,
      };

    case 'order_confirmation':
      return {
        subject: "Your Nomiqa eSIM Order is Confirmed! 🌍",
        html: `
          ${baseStyle}
          <div class="container">
            <div class="logo"><img src="${logoSrc}" alt="Nomiqa" /></div>
            <h1>Order Confirmed! 🌍</h1>
            <p class="text" style="font-size: 18px; margin-bottom: 24px;">Thank you for your order!</p>
            <p class="text" style="color: #9ca3af; font-size: 14px; margin-bottom: 32px;">Order Number: <strong>${data.orderId}</strong></p>
            <div style="background: rgba(155, 135, 245, 0.05); border: 1px solid rgba(155, 135, 245, 0.2); border-radius: 12px; padding: 24px; margin: 32px 0;">
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: center;">Order Details</h2>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(155, 135, 245, 0.1);">
                <span style="color: #9ca3af; font-size: 14px;">Country:</span>
                <span style="color: #00e5ff; font-size: 14px; font-weight: 600;">${data.country}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(155, 135, 245, 0.1);">
                <span style="color: #9ca3af; font-size: 14px;">Data:</span>
                <span style="color: #00e5ff; font-size: 14px; font-weight: 600;">${data.dataAmount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(155, 135, 245, 0.1);">
                <span style="color: #9ca3af; font-size: 14px;">Validity:</span>
                <span style="color: #00e5ff; font-size: 14px; font-weight: 600;">${data.validity} days</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #9ca3af; font-size: 14px;">Price:</span>
                <span style="color: #00e5ff; font-size: 14px; font-weight: 600;">$${data.price}</span>
              </div>
            </div>
            <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
              <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin-bottom: 8px;">✓ Your eSIM is being prepared</p>
              <p style="color: #e0e0e0; font-size: 14px;">You'll receive your activation details shortly</p>
            </div>
            <p class="text" style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
              Need help? Contact us at support@nomiqa-esim.com
            </p>
            <p class="footer">Private. Borderless. Human.</p>
          </div>
        `,
      };

    case 'affiliate_welcome':
      return {
        subject: "Welcome to the Nomiqa Affiliate Program! 🚀",
        html: `
          ${baseStyle}
          <div class="container">
            <div class="logo"><img src="${logoSrc}" alt="Nomiqa" /></div>
            <h1>Welcome to the Nomiqa Affiliate Program! 🚀</h1>
            <p class="text" style="color: #ffffff; font-size: 20px; font-weight: 600; margin-bottom: 16px;">Welcome, ${data.username}! 🎉</p>
            <p class="text" style="margin-bottom: 32px;">Your affiliate account is now active!</p>
            <div style="background: rgba(155, 135, 245, 0.1); border: 2px solid #9b87f5; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">Your Affiliate Code:</p>
              <p style="color: #00e5ff; font-size: 28px; font-weight: 700; letter-spacing: 2px; text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);">${data.affiliateCode}</p>
            </div>
            <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; padding: 24px; margin: 32px 0;">
              <h2 style="color: #00e5ff; font-size: 20px; font-weight: 600; margin-bottom: 12px; text-align: center;">Start Earning REAL Crypto</h2>
              <p class="text" style="font-size: 14px; line-height: 22px; margin-bottom: 20px;">Unlike other platforms that pay in vouchers, we pay you in real USDC & SOL cryptocurrency:</p>
              <p class="text" style="color: #00e5ff; font-size: 14px; margin-bottom: 8px;">✓ Level 1: 9% direct referral commission</p>
              <p class="text" style="color: #00e5ff; font-size: 14px; margin-bottom: 8px;">✓ Level 2: 6% passive income (after 10 conversions)</p>
              <p class="text" style="color: #00e5ff; font-size: 14px;">✓ Level 3: 3% passive income (after 30 conversions)</p>
            </div>
            <p class="text" style="color: #9ca3af; font-size: 14px;">Visit your dashboard to start sharing your link</p>
            <p class="footer">Private. Borderless. Human.</p>
          </div>
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
        subject: `🎉 You've unlocked ${tierName}!`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="logo"><img src="${logoSrc}" alt="Nomiqa" /></div>
            <div style="text-align: center; margin-bottom: 32px;">
              <p style="font-size: 48px; margin-bottom: 16px;">🎉 ${tierEmojis[data.tier.toLowerCase()] || "✨"} 🎉</p>
              <h1 style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Congratulations, ${data.username}!</h1>
            </div>
            <div style="background: rgba(155, 135, 245, 0.1); border: 2px solid #9b87f5; border-radius: 16px; padding: 32px; margin: 32px 0; text-align: center; box-shadow: 0 0 40px rgba(155, 135, 245, 0.3);">
              <p style="color: #9ca3af; font-size: 16px; margin-bottom: 12px;">You've unlocked</p>
              <p style="color: #00e5ff; font-size: 36px; font-weight: 700; text-shadow: 0 0 30px rgba(0, 229, 255, 0.6);">${tierName}</p>
            </div>
            <div style="background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">New Cashback Rate:</p>
              <p style="color: #00e5ff; font-size: 48px; font-weight: 700;">${data.cashbackRate}%</p>
            </div>
            <p class="text" style="font-size: 18px; line-height: 28px; margin-bottom: 32px;">
              You now earn ${data.cashbackRate}% cashback on all eSIM purchases!
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <p class="text" style="font-weight: 600; margin-bottom: 12px;">Thank you for being a valued Nomiqa member</p>
              <p class="text" style="color: #9ca3af; font-size: 14px;">Continue exploring with Nomiqa and unlock even more rewards</p>
            </div>
            <p class="footer">Private. Borderless. Human.</p>
          </div>
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
