import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration: 5 emails per hour per recipient
const RATE_LIMIT_WINDOW_HOURS = 1;
const RATE_LIMIT_MAX_EMAILS = 5;

// Zod validation schema for email requests
const emailRequestSchema = z.object({
  type: z.enum(['user_verification', 'password_reset', 'affiliate_verification', 'order_confirmation', 'affiliate_welcome', 'tier_upgrade', 'affiliate_tier_upgrade', 'claim_request', 'early_member_welcome']),
  to: z.string().email().max(255),
  language: z.string().max(10).optional(),
  data: z.record(z.any())
});

interface EmailRequest {
  type: 'user_verification' | 'password_reset' | 'affiliate_verification' | 'order_confirmation' | 'affiliate_welcome' | 'tier_upgrade' | 'affiliate_tier_upgrade' | 'claim_request' | 'early_member_welcome';
  to: string;
  language?: string;
  data: Record<string, any>;
}

const generateEmailHTML = (type: string, data: any): { html: string; subject: string } => {
  const logoUrl = "https://nomiqa-esim.com/nomiqa-logo.jpg";

  switch (type) {
    case 'user_verification':
      return {
        subject: "Verify Your Nomiqa Account ✨",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #8b5cf6; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px;">
              ✨ Welcome to Nomiqa!
            </h1>
            
            <div style="background: #f3e8ff; border: 2px solid #8b5cf6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #6b21a8; font-weight: bold;">Your Verification Code</p>
              <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 900; color: #7c3aed; letter-spacing: 8px; text-align: center;">${data.code}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <p style="color: #666; line-height: 1.6;">Your account has been created successfully! Please enter the verification code above to activate your account and start your journey with Nomiqa.</p>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">⏱️ This code expires in 15 minutes</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
              <p style="margin: 0; color: #999; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };

    case 'password_reset':
      return {
        subject: "Reset Your Nomiqa Password 🔐",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #0ea5e9; box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
              🔐 Reset Your Password
            </h1>
            
            <div style="background: #dbeafe; border: 2px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #075985; font-weight: bold;">Your Reset Code</p>
              <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 900; color: #0284c7; letter-spacing: 8px; text-align: center;">${data.code}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Use the code above to create a new password for your Nomiqa account.</p>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">⏱️ This code expires in 15 minutes</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
              <p style="margin: 0; color: #999; font-size: 14px;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };

    case 'affiliate_verification':
      return {
        subject: "Start Earning with Nomiqa 💰",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #10b981; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
              💰 Start Earning Today!
            </h1>
            
            <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">Your Verification Code</p>
              <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 900; color: #059669; letter-spacing: 8px; text-align: center;">${data.code}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <p style="color: #666; line-height: 1.6;">Your affiliate account is almost ready! Verify your email to start earning real crypto (USDC & SOL) through the Nomiqa affiliate program.</p>
            </div>

            <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">💎 Earn Real Crypto (USDC & SOL)</p>
              <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">9% direct + 6% tier 2 + 3% tier 3 commission</p>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">⏱️ Code expires in 15 minutes</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };

    case 'order_confirmation':
      return {
        subject: "Your Nomiqa eSIM is Ready! 🎉",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #10b981; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
              🎉 Order Confirmed!
            </h1>
            
            <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">✓ Your eSIM is Ready to Activate</p>
              <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">Your order has been processed successfully!</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h2 style="color: #666; font-size: 18px;">Order Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Country:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.country || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Data Amount:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.dataAmount || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Validity:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.validity || 'N/A'} days</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 2px solid #333;"><strong>Total Paid:</strong></td>
                  <td style="padding: 8px; border-bottom: 2px solid #333; font-size: 20px; font-weight: bold; color: #10b981;">$${data.price || '0.00'}</td>
                </tr>
              </table>
            </div>

            ${data.sharingLink ? `
            <div style="margin: 20px 0;">
              <div style="background: #dbeafe; border: 2px solid #0ea5e9; border-radius: 8px; padding: 15px;">
                <p style="margin: 0 0 10px 0; color: #075985; font-weight: bold;">🔗 Access Your eSIM</p>
                <p style="margin: 0 0 15px 0; color: #0369a1; font-size: 14px;">Click below to view your eSIM details and QR code:</p>
                <div style="text-align: center;">
                  <a href="${data.sharingLink}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold;">View eSIM Details</a>
                </div>
                ${data.accessCode ? `
                  <p style="margin: 15px 0 0 0; color: #0369a1; font-size: 13px;">
                    <strong>Access Code:</strong> <code style="background: rgba(14, 165, 233, 0.2); padding: 4px 12px; border-radius: 4px; font-weight: bold;">${data.accessCode}</code>
                  </p>
                ` : ''}
              </div>
            </div>
            ` : ''}

            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #666; font-weight: bold;">📱 Next Steps:</p>
              <ol style="margin: 0; padding-left: 20px; color: #666;">
                <li>Access your eSIM using the link above</li>
                <li>Scan the QR code with your device</li>
                <li>Follow the activation instructions</li>
                <li>Enjoy your global connectivity!</li>
              </ol>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };

    case 'tier_upgrade':
      return {
        subject: "🎉 Congratulations! You've Unlocked a New Tier!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #f59e0b; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
              🎉 Membership Tier Upgraded!
            </h1>
            
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: bold; text-align: center;">✓ Tier Upgrade Confirmed</p>
              <p style="margin: 8px 0 0 0; color: #b45309; font-size: 14px; text-align: center;">You've unlocked a new level of benefits!</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h2 style="color: #666; font-size: 18px;">Tier Progression</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Previous Tier:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #94a3b8;">${data.oldTier || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>New Tier:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #f59e0b; font-weight: bold;">${data.newTier || 'N/A'} 🎉</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 2px solid #333;"><strong>Total Spent:</strong></td>
                  <td style="padding: 8px; border-bottom: 2px solid #333; font-size: 20px; font-weight: bold; color: #10b981;">$${data.totalSpent?.toFixed(2) || '0.00'}</td>
                </tr>
              </table>
            </div>

            <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #065f46; font-weight: bold;">🎁 Your New Benefits</p>
              <p style="margin: 0; color: #047857; font-size: 14px;">Enjoy increased cashback rates, exclusive offers, and priority support with your new membership tier!</p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://nomiqa-esim.com" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold;">View Account Benefits</a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };

    case 'affiliate_tier_upgrade':
      return {
        subject: "🚀 Affiliate Tier Upgraded! Unlock Higher Earnings!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #8b5cf6; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px;">
              🚀 Affiliate Tier Upgraded!
            </h1>
            
            <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border: 2px solid #8b5cf6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #6b21a8; font-weight: bold; text-align: center;">✓ You've Unlocked a New Tier!</p>
              <p style="margin: 8px 0 0 0; color: #7c3aed; font-size: 14px; text-align: center;">Higher commissions & more earning potential!</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h2 style="color: #666; font-size: 18px;">Tier Progression</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Previous Tier:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #94a3b8;">${data.oldTierName || data.oldTier || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>New Tier:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #8b5cf6; font-weight: bold;">${data.newTierName || data.newTier || 'N/A'} 🚀</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total Conversions:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #0ea5e9; font-weight: bold;">${data.totalConversions || 0}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 2px solid #333;"><strong>Total Earnings:</strong></td>
                  <td style="padding: 8px; border-bottom: 2px solid #333; font-size: 20px; font-weight: bold; color: #10b981;">$${data.totalEarnings?.toFixed(2) || '0.00'}</td>
                </tr>
              </table>
            </div>

            <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #065f46; font-weight: bold;">💰 Your New Commission Structure</p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #047857;">
                <li>9% commission on direct referrals</li>
                ${data.newTier >= 2 ? '<li>6% commission on tier 2 referrals</li>' : ''}
                ${data.newTier >= 3 ? '<li>3% commission on tier 3 referrals</li>' : ''}
              </ul>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://nomiqa-esim.com/english/affiliate" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold;">View Affiliate Dashboard</a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };

    case 'claim_request':
      return {
        subject: "New Claim Request from Nomiqa User",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #f59e0b; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
              💰 New Claim Request
            </h1>
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">A user has submitted a claim request</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h2 style="color: #666; font-size: 18px;">Claim Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>User Email:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.userEmail || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Wallet Address:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; word-break: break-all;">${data.walletAddress || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Affiliate Earnings:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #10b981; font-weight: bold;">$${data.affiliateEarnings?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 2px solid #333;"><strong>Total to Pay:</strong></td>
                  <td style="padding: 8px; border-bottom: 2px solid #333; font-size: 20px; font-weight: bold; color: #f59e0b;">$${data.totalAmount?.toFixed(2) || '0.00'}</td>
                </tr>
              </table>
            </div>

            ${data.notes ? `
            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #666; font-weight: bold;">📝 User Notes:</p>
              <p style="margin: 0; color: #666;">${data.notes}</p>
            </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };

    case 'early_member_welcome':
      return {
        subject: "🎉 You're In! Welcome to the Nomiqa Network",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); padding: 40px 20px; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${logoUrl}" alt="Nomiqa" style="width: 100px; height: 100px; border-radius: 20px; border: 2px solid #22d3ee; box-shadow: 0 4px 20px rgba(34, 211, 238, 0.4);" />
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">🎉</span>
                <h1 style="color: #22d3ee; font-size: 32px; margin: 15px 0 5px 0; font-weight: 300;">You're In!</h1>
                <p style="color: #e2e8f0; font-size: 18px; margin: 0;">Welcome to the Nomiqa Network</p>
              </div>
              
              <div style="background: rgba(34, 211, 238, 0.1); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0; text-align: center;">
                  You've secured your spot as an <span style="color: #22d3ee; font-weight: bold;">early member</span> of the world's first community-owned DePIN mobile network.
                </p>
              </div>
              
              <div style="margin: 30px 0;">
                <h2 style="color: #a78bfa; font-size: 18px; margin-bottom: 20px; font-weight: 400;">✨ What happens next?</h2>
                <div style="space-y: 16px;">
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <span style="color: #22d3ee; margin-right: 12px; font-size: 18px;">🔧</span>
                    <p style="color: #cbd5e1; margin: 0; font-size: 15px;">We're building the network infrastructure</p>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <span style="color: #22d3ee; margin-right: 12px; font-size: 18px;">📧</span>
                    <p style="color: #cbd5e1; margin: 0; font-size: 15px;">You'll receive updates on our progress</p>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <span style="color: #22d3ee; margin-right: 12px; font-size: 18px;">⭐</span>
                    <p style="color: #cbd5e1; margin: 0; font-size: 15px;">Early members get priority access to rewards</p>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <span style="color: #22d3ee; margin-right: 12px; font-size: 18px;">🚀</span>
                    <p style="color: #cbd5e1; margin: 0; font-size: 15px;">When we launch, you'll be first in line</p>
                  </div>
                </div>
              </div>
              
              <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="color: #4ade80; font-size: 15px; margin: 0;">
                  <span style="font-size: 18px;">✓</span> <strong>No action needed</strong> — we'll email you when it's time to activate
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://nomiqa-esim.com" style="display: inline-block; background: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%); color: #0f172a; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: bold; font-size: 15px;">Explore Nomiqa</a>
              </div>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">© 2025 Nomiqa - Private. Borderless. Human.</p>
                <p style="color: #475569; font-size: 11px; margin: 8px 0 0 0;">The world's first community-owned DePIN mobile network</p>
              </div>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: "Nomiqa Notification",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Nomiqa" style="width: 120px; height: 120px; border-radius: 20px; border: 2px solid #0ea5e9; box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);" />
            </div>
            
            <h1 style="color: #333; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
              Nomiqa Notification
            </h1>
            
            <div style="margin: 20px 0;">
              <p style="color: #666; line-height: 1.6;">You have a new notification from Nomiqa.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>© 2025 Nomiqa - Private. Borderless. Human.</p>
              <p style="margin: 8px 0 0 0;">This is an automated message from Nomiqa eSIM platform.</p>
            </div>
          </div>
        `,
      };
  }
};

// Check rate limit for email recipient
async function checkRateLimit(supabase: any, email: string, emailType: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

  // Count emails sent to this recipient in the rate limit window
  const { data, error } = await supabase
    .from('email_rate_limits')
    .select('id', { count: 'exact' })
    .eq('email', email.toLowerCase())
    .gte('sent_at', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    // Allow on error to avoid blocking legitimate emails
    return { allowed: true };
  }

  const count = data?.length || 0;
  
  if (count >= RATE_LIMIT_MAX_EMAILS) {
    // Get oldest email in window to calculate retry time
    const { data: oldestEmail } = await supabase
      .from('email_rate_limits')
      .select('sent_at')
      .eq('email', email.toLowerCase())
      .gte('sent_at', windowStart.toISOString())
      .order('sent_at', { ascending: true })
      .limit(1);

    const retryAfter = oldestEmail?.[0]?.sent_at 
      ? Math.ceil((new Date(oldestEmail[0].sent_at).getTime() + RATE_LIMIT_WINDOW_HOURS * 3600000 - Date.now()) / 1000)
      : 3600;

    return { allowed: false, retryAfter: Math.max(retryAfter, 60) };
  }

  return { allowed: true };
}

// Record email send for rate limiting
async function recordEmailSend(supabase: any, email: string, emailType: string): Promise<void> {
  const { error } = await supabase
    .from('email_rate_limits')
    .insert({
      email: email.toLowerCase(),
      email_type: emailType,
      sent_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to record email send:', error);
  }

  // Clean up old records periodically (1% chance per request)
  if (Math.random() < 0.01) {
    await supabase.rpc('cleanup_old_email_rate_limits').catch(() => {});
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify internal call - this endpoint should ONLY be called by other edge functions
    // Require service role key - anon key is NOT allowed for this privileged operation
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('apikey');
    const expectedServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!expectedServiceKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // SECURITY: Only allow service role key - no anon key to prevent client-side abuse
    const isInternalCall = 
      (authHeader && authHeader === `Bearer ${expectedServiceKey}`) ||
      (apiKey && apiKey === expectedServiceKey);
    
    if (!isInternalCall) {
      console.warn("Unauthorized access attempt to send-email endpoint");
      return new Response(
        JSON.stringify({ error: "Unauthorized - internal endpoint only" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    const { type, to, data } = validationResult.data;

    // Initialize Supabase client with service role for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit before sending
    const rateLimit = await checkRateLimit(supabase, to, type);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for ${to} - ${type}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many emails sent to this address. Please try again later.",
          retryAfter: rateLimit.retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter || 3600)
          } 
        }
      );
    }

    // Mask email for logging
    const maskedEmail = to.replace(/(.{2}).*@/, '$1***@');
    console.log(`Sending ${type} email to ${maskedEmail}`);

    const { html, subject } = generateEmailHTML(type, data);

    const emailResponse = await resend.emails.send({
      from: "Nomiqa <support@nomiqa-esim.com>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", { id: emailResponse.data?.id, type });

    // Record successful email send for rate limiting
    await recordEmailSend(supabase, to, type);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
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
