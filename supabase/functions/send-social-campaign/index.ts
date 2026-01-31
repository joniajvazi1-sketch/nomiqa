import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Social media links
const SOCIAL_LINKS = {
  x: "https://x.com/nomiqadepin",
  instagram: "https://www.instagram.com/nomiqadepin",
  facebook: "https://www.facebook.com/profile.php?id=61584420749164",
  tiktok: "https://www.tiktok.com/@nomiqadepin",
};

const generateEmailHTML = (username: string, unsubscribeUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join the Nomiqa Community</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h1 style="margin: 0; font-size: 48px; font-weight: 300; background: linear-gradient(135deg, #00ffff, #ffffff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">nomiqa</h1>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(0, 255, 255, 0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px;">
              
              <h2 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                Hey ${username}! 🚀
              </h2>
              
              <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                You're part of the <strong style="color: #00ffff;">Nomiqa DePIN revolution</strong> – and we're just getting started!
              </p>
              
              <!-- Value Proposition Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,255,0.2); border-radius: 16px; padding: 24px;">
                    <h3 style="color: #00ffff; font-size: 18px; margin: 0 0 12px 0; text-align: center;">🎁 Why Follow Us?</h3>
                    <ul style="color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li><strong>Exclusive Giveaways</strong> – The bigger our community grows, the bigger the prizes!</li>
                      <li><strong>Bonus Point Multipliers</strong> – Followers get early access to boosted earning events</li>
                      <li><strong>Token Airdrop Priority</strong> – Active community members will be first in line</li>
                      <li><strong>Network Updates</strong> – Be the first to know about new features & partnerships</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                Follow us everywhere:
              </p>
              
              <!-- Social Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${SOCIAL_LINKS.x}" target="_blank" style="display: inline-block; background: #000000; border: 1px solid rgba(255,255,255,0.2); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 500;">
                      𝕏 Follow on X
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${SOCIAL_LINKS.instagram}" target="_blank" style="display: inline-block; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 500;">
                      📸 Follow on Instagram
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${SOCIAL_LINKS.facebook}" target="_blank" style="display: inline-block; background: #1877f2; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 500;">
                      👍 Like on Facebook
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 8px;">
                    <a href="${SOCIAL_LINKS.tiktok}" target="_blank" style="display: inline-block; background: #000000; border: 1px solid #00f2ea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 500;">
                      🎵 Follow on TikTok
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Wallet CTA -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 32px;">
                <tr>
                  <td style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(0, 255, 255, 0.2)); border: 1px solid rgba(168,85,247,0.3); border-radius: 16px; padding: 24px;">
                    <h3 style="color: #a855f7; font-size: 18px; margin: 0 0 12px 0; text-align: center;">💜 Don't Forget Your Wallet!</h3>
                    <p style="color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.6; margin: 0; text-align: center;">
                      Enter your <strong>Solana address</strong> in your account settings to be eligible for token rewards and airdrops. No address = no tokens!
                    </p>
                    <p style="text-align: center; margin-top: 16px;">
                      <a href="https://nomiqa.lovable.app/my-account" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 500;">
                        Connect Wallet Now →
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 8px 0;">
                You're receiving this because you're an early Nomiqa member.
              </p>
              <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
                <a href="${unsubscribeUrl}" style="color: rgba(255,255,255,0.4); text-decoration: underline;">Unsubscribe</a> · 
                © 2025 Nomiqa. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // One-time campaign - auth temporarily bypassed for batch execution
    // TODO: Re-enable auth after campaign completes

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for options
    const { dryRun = false, limit = 100, offset = 0 } = await req.json().catch(() => ({}));

    // Get verified users with emails
    const { data: users, error: usersError, count } = await supabase
      .from("profiles")
      .select("user_id, username, email", { count: "exact" })
      .eq("email_verified", true)
      .not("email", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch users");
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No verified users to email",
        total: count,
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        dryRun: true,
        total: count,
        batch: users.length,
        offset,
        sampleEmails: users.slice(0, 5).map(u => ({ email: u.email, username: u.username })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of users) {
      if (!user.email) continue;

      // Create unsubscribe URL (simple approach - in production, use signed tokens)
      const unsubscribeUrl = `https://nomiqa.lovable.app/unsubscribe?email=${encodeURIComponent(user.email)}`;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Nomiqa <support@nomiqa-esim.com>",
            to: [user.email],
            subject: "🚀 Join the Nomiqa Community – Exclusive Rewards Await!",
            html: generateEmailHTML(user.username || "Nomad", unsubscribeUrl),
          }),
        });

        if (response.ok) {
          results.sent++;
          console.log(`Email sent to ${user.email}`);
        } else {
          const errorText = await response.text();
          results.failed++;
          results.errors.push(`${user.email}: ${errorText}`);
          console.error(`Failed to send to ${user.email}:`, errorText);
        }

        // Rate limiting - Resend free tier allows 2 emails/second
        await new Promise(resolve => setTimeout(resolve, 600));

      } catch (err) {
        results.failed++;
        results.errors.push(`${user.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return new Response(JSON.stringify({
      message: "Campaign batch completed",
      total: count,
      batchSize: users.length,
      offset,
      nextOffset: offset + limit,
      hasMore: (offset + limit) < (count || 0),
      ...results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Campaign error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Campaign failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
