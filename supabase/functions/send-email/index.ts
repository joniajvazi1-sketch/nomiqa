import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schema for email requests
const emailRequestSchema = z.object({
  type: z.enum(['user_verification', 'password_reset', 'affiliate_verification', 'order_confirmation', 'affiliate_welcome', 'tier_upgrade', 'affiliate_tier_upgrade', 'claim_request']),
  to: z.string().email().max(255),
  language: z.string().max(10).optional(),
  data: z.record(z.any())
});

interface EmailRequest {
  type: 'user_verification' | 'password_reset' | 'affiliate_verification' | 'order_confirmation' | 'affiliate_welcome' | 'tier_upgrade' | 'affiliate_tier_upgrade' | 'claim_request';
  to: string;
  language?: string;
  data: Record<string, any>;
}

const generateEmailHTML = (type: string, data: any): { html: string; subject: string } => {
  const baseStyle = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        background: linear-gradient(135deg, #050505 0%, #0a0a1f 50%, #1a0a2e 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        margin: 0; 
        padding: 0;
        width: 100%;
      }
      .email-wrapper {
        background: linear-gradient(135deg, #050505 0%, #0a0a1f 50%, #1a0a2e 100%);
        padding: 60px 20px;
        width: 100%;
        position: relative;
      }
      .email-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 0% 100%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
        pointer-events: none;
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
        backdrop-filter: blur(60px) saturate(180%);
        -webkit-backdrop-filter: blur(60px) saturate(180%);
        border-radius: 40px;
        border: 2px solid transparent;
        background-clip: padding-box;
        position: relative;
        padding: 56px 48px;
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.6),
          0 1px 2px rgba(255, 255, 255, 0.1) inset,
          0 40px 80px rgba(139, 92, 246, 0.15);
      }
      .container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 40px;
        padding: 2px;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(6, 182, 212, 0.4));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      .logo-section { 
        text-align: center; 
        margin-bottom: 48px;
        position: relative;
      }
      .logo-section::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 180px;
        height: 180px;
        background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
        filter: blur(40px);
        pointer-events: none;
        z-index: 0;
      }
      .logo-section img { 
        width: 140px; 
        height: 140px; 
        border-radius: 32px; 
        border: 3px solid rgba(139, 92, 246, 0.6);
        box-shadow: 
          0 0 60px rgba(139, 92, 246, 0.5),
          0 8px 32px rgba(0, 0, 0, 0.4),
          0 2px 4px rgba(255, 255, 255, 0.1) inset;
        position: relative;
        z-index: 1;
      }
      h1 { 
        background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 38px;
        font-weight: 900;
        text-align: center;
        margin: 0 0 20px 0;
        letter-spacing: -1px;
        filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.3));
      }
      .subtitle {
        color: #e2e8f0;
        font-size: 17px;
        line-height: 28px;
        text-align: center;
        margin: 0 0 40px 0;
        font-weight: 400;
        opacity: 0.95;
      }
      .code-container {
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
        backdrop-filter: blur(20px);
        border: 2px solid transparent;
        background-clip: padding-box;
        border-radius: 24px;
        padding: 48px 32px;
        margin: 40px 0;
        text-align: center;
        box-shadow: 
          0 0 80px rgba(139, 92, 246, 0.25),
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 1px 2px rgba(255, 255, 255, 0.1) inset;
        position: relative;
      }
      .code-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 24px;
        padding: 2px;
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.5), rgba(139, 92, 246, 0.5));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      .code-display {
        font-size: 60px;
        font-weight: 900;
        letter-spacing: 20px;
        background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
        filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.6));
      }
      .info-box {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 20px;
        padding: 20px 24px;
        margin: 28px 0;
        text-align: center;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
      }
      .info-box p {
        color: #fca5a5;
        font-size: 15px;
        font-weight: 600;
        margin: 0;
      }
      .success-box {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 20px;
        padding: 24px;
        margin: 28px 0;
        text-align: center;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
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
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(6, 182, 212, 0.25);
        border-radius: 24px;
        padding: 32px 28px;
        margin: 32px 0;
        box-shadow: 0 4px 24px rgba(6, 182, 212, 0.15);
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
      .detail-label {
        color: #94a3b8;
        font-size: 15px;
      }
      .detail-value {
        color: #f1f5f9;
        font-size: 16px;
        font-weight: 700;
      }
      .total-row {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 2px solid rgba(139, 92, 246, 0.3);
      }
      .total-label {
        color: #e2e8f0;
        font-size: 17px;
        font-weight: 700;
      }
      .total-value {
        font-size: 32px;
        font-weight: 900;
        background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%);
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
        box-shadow: 
          0 8px 32px rgba(139, 92, 246, 0.5),
          0 0 60px rgba(139, 92, 246, 0.3),
          0 2px 4px rgba(255, 255, 255, 0.2) inset;
        transition: transform 0.2s ease;
      }
      .text-muted {
        color: #94a3b8;
        font-size: 15px;
        line-height: 26px;
        text-align: center;
        margin: 28px 0 0 0;
        opacity: 0.9;
      }
      .footer {
        text-align: center;
        margin-top: 48px;
        padding-top: 32px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .footer-text {
        color: #94a3b8;
        font-size: 14px;
        margin: 0 0 8px 0;
        font-weight: 600;
      }
      .footer-subtext {
        color: #64748b;
        font-size: 13px;
        margin: 0;
      }
      @media only screen and (max-width: 600px) {
        .container { padding: 40px 28px; border-radius: 32px; }
        h1 { font-size: 30px; }
        .code-display { font-size: 48px; letter-spacing: 14px; }
        .cta-button { padding: 16px 36px; font-size: 16px; }
        .logo-section img { width: 120px; height: 120px; }
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
                  ${data.sharingLink ? `
                    <div class="success-box">
                      <p class="title">🔗 Access Your eSIM</p>
                      <p class="text" style="margin-bottom: 16px;">Click below to view your eSIM details and QR code:</p>
                      <div style="text-align: center; margin-top: 20px;">
                        <a href="${data.sharingLink}" class="cta-button" style="display: inline-block;">View eSIM Details</a>
                      </div>
                      ${data.accessCode ? `
                        <p class="text" style="margin-top: 20px; font-size: 13px;">
                          <strong>Access Code:</strong> <span style="font-family: 'SF Mono', monospace; background: rgba(139, 92, 246, 0.2); padding: 4px 12px; border-radius: 8px; font-weight: 700;">${data.accessCode}</span>
                        </p>
                      ` : ''}
                    </div>
                  ` : `
                    <div class="success-box">
                      <p class="title">✨ Next Steps</p>
                      <p class="text">Check your account to view activation instructions and QR code</p>
                    </div>
                  `}
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="https://nomiqa-esim.com/my-account" class="cta-button">View My Account</a>
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
      const tierCashback: Record<string, number> = {
        beginner: 5,
        traveler: 6,
        adventurer: 7,
        explorer: 10,
      };
      const newTierName = data.newTier.charAt(0).toUpperCase() + data.newTier.slice(1);
      const newCashback = tierCashback[data.newTier.toLowerCase()] || 5;
      return {
        subject: `🎉 You've Unlocked ${newTierName} Membership!`,
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
                    <div style="font-size: 88px; margin-bottom: 24px;">${tierEmojis[data.newTier.toLowerCase()] || "✨"}</div>
                    <h1 style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Congratulations!</h1>
                    <p class="subtitle" style="font-size: 19px; font-weight: 600; color: #e2e8f0;">You've reached ${newTierName}</p>
                  </div>
                  <div style="background: rgba(139, 92, 246, 0.08); border: 3px solid rgba(139, 92, 246, 0.3); border-radius: 24px; padding: 40px 32px; margin: 32px 0; text-align: center; box-shadow: 0 0 50px rgba(139, 92, 246, 0.25);">
                    <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 16px; font-weight: 600; letter-spacing: 0.5px;">YOU'VE UNLOCKED</p>
                    <p style="color: #06b6d4; font-size: 44px; font-weight: 900; text-shadow: 0 0 40px rgba(6, 182, 212, 0.5); letter-spacing: -0.5px;">${newTierName} Tier</p>
                  </div>
                  <div style="background: rgba(16, 185, 129, 0.08); border: 2px solid rgba(16, 185, 129, 0.25); border-radius: 20px; padding: 40px 32px; margin: 32px 0; text-align: center;">
                    <p style="color: #a7f3d0; font-size: 15px; margin-bottom: 12px; font-weight: 600;">NEW CASHBACK RATE</p>
                    <p style="color: #6ee7b7; font-size: 64px; font-weight: 900; line-height: 1;">${newCashback}%</p>
                    <p style="color: #d1fae5; font-size: 16px; margin-top: 16px; font-weight: 600;">on all eSIM purchases!</p>
                  </div>
                  <div style="background: rgba(6, 182, 212, 0.08); border: 2px solid rgba(6, 182, 212, 0.25); border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center;">
                    <p style="color: #67e8f9; font-size: 14px; margin-bottom: 8px; font-weight: 600;">TOTAL SPENT</p>
                    <p style="color: #06b6d4; font-size: 32px; font-weight: 900; line-height: 1;">$${data.totalSpent}</p>
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

    case 'affiliate_tier_upgrade':
      const affiliateTierNames: Record<number, string> = {
        1: "Starter",
        2: "Pro",
        3: "Elite",
      };
      const affiliateTierEmojis: Record<number, string> = {
        1: "🌟",
        2: "💫",
        3: "👑",
      };
      const affiliateNewTierName = affiliateTierNames[data.newTier] || `Tier ${data.newTier}`;
      const benefits: Record<number, string[]> = {
        2: ["Earn 9% on direct sales", "NEW: Earn 6% on 2nd level referrals"],
        3: ["Earn 9% on direct sales", "Earn 6% on 2nd level referrals", "NEW: Earn 3% on 3rd level referrals"],
      };
      return {
        subject: `🎉 Affiliate Tier Upgraded to ${affiliateNewTierName}!`,
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
                    <div style="font-size: 88px; margin-bottom: 24px;">${affiliateTierEmojis[data.newTier] || "✨"}</div>
                    <h1 style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Affiliate Tier Upgraded!</h1>
                    <p class="subtitle" style="font-size: 19px; font-weight: 600; color: #e2e8f0;">You've reached ${affiliateNewTierName}</p>
                  </div>
                  <div style="background: rgba(139, 92, 246, 0.08); border: 3px solid rgba(139, 92, 246, 0.3); border-radius: 24px; padding: 40px 32px; margin: 32px 0; text-align: center; box-shadow: 0 0 50px rgba(139, 92, 246, 0.25);">
                    <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 16px; font-weight: 600; letter-spacing: 0.5px;">NEW AFFILIATE TIER</p>
                    <p style="color: #8b5cf6; font-size: 44px; font-weight: 900; text-shadow: 0 0 40px rgba(139, 92, 246, 0.5); letter-spacing: -0.5px;">${affiliateNewTierName}</p>
                  </div>
                  <div style="background: rgba(16, 185, 129, 0.08); border: 2px solid rgba(16, 185, 129, 0.25); border-radius: 20px; padding: 40px 32px; margin: 32px 0;">
                    <p style="color: #a7f3d0; font-size: 15px; margin-bottom: 20px; font-weight: 600; text-align: center;">YOUR NEW COMMISSION STRUCTURE</p>
                    ${(benefits[data.newTier] || []).map((benefit: string) => `
                      <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span style="color: #10b981; margin-right: 12px; font-size: 20px;">✓</span>
                        <span style="color: #d1fae5; font-size: 16px;">${benefit}</span>
                      </div>
                    `).join('')}
                  </div>
                  <div style="background: rgba(6, 182, 212, 0.08); border: 2px solid rgba(6, 182, 212, 0.25); border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center;">
                    <p style="color: #67e8f9; font-size: 14px; margin-bottom: 8px; font-weight: 600;">TOTAL CONVERSIONS</p>
                    <p style="color: #06b6d4; font-size: 48px; font-weight: 900; line-height: 1;">${data.totalConversions}</p>
                  </div>
                  <p class="subtitle" style="font-size: 17px; line-height: 30px; text-align: center; margin: 32px 0;">
                    Keep sharing Nomiqa and watch your earnings grow with our multi-tier commission system!
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

    case 'claim_request':
      return {
        subject: `💰 Earnings Claim Request from ${data.username || data.userEmail}`,
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
                  <h1>💰 New Earnings Claim Request</h1>
                  <p class="subtitle">A user has requested to claim their earnings</p>
                  <div class="details-card">
                    <div class="detail-row">
                      <span class="detail-label">User ID</span>
                      <span class="detail-value">${data.userId}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Email</span>
                      <span class="detail-value">${data.userEmail}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Username</span>
                      <span class="detail-value">${data.username || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Solana Wallet</span>
                      <span class="detail-value" style="font-size: 14px; word-break: break-all;">${data.walletAddress}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Affiliate Earnings</span>
                      <span class="detail-value">$${data.affiliateEarnings}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Cashback Earnings</span>
                      <span class="detail-value">$${data.cashbackEarnings}</span>
                    </div>
                    <div class="detail-row total-row">
                      <span class="total-label">Total Claim Amount</span>
                      <span class="total-value">$${data.totalAmount}</span>
                    </div>
                  </div>
                  ${data.message ? `
                    <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 16px; padding: 20px; margin: 24px 0;">
                      <p style="color: #67e8f9; font-size: 14px; margin-bottom: 8px; font-weight: 600;">USER MESSAGE:</p>
                      <p style="color: #e2e8f0; font-size: 15px; line-height: 24px;">${data.message}</p>
                    </div>
                  ` : ''}
                  <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 16px; padding: 16px; margin: 24px 0; text-align: center;">
                    <p style="color: #fca5a5; font-size: 13px; margin: 0;">
                      ⏰ Requested at: ${new Date(data.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div class="footer">
                    <p class="footer-text">© 2025 Nomiqa Support System</p>
                    <p class="footer-subtext">Process this claim manually</p>
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
    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validationResult = emailRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Email validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid email request format",
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, to, language = 'en', data } = validationResult.data;
    
    // Rate limiting: Check recent email sends from this recipient
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentEmails, error: rateLimitError } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'email_sent')
      .gte('created_at', oneHourAgo)
      .like('payload->>to', `%${to}%`)
      .limit(10);

    if (!rateLimitError && recentEmails && recentEmails.length >= 10) {
      console.log(`Rate limit exceeded for email: ${to}`);
      return new Response(
        JSON.stringify({ error: 'Too many email requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { html, subject } = generateEmailHTML(type, data);

    const emailResponse = await resend.emails.send({
      from: "Nomiqa <support@nomiqa-esim.com>",
      to: [to],
      subject,
      html,
    });

    // Log this email send for rate limiting
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'email_sent',
        payload: { type, to: to.substring(0, 20) + '...', timestamp: new Date().toISOString() }
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
