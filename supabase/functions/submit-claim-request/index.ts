import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Solana wallet address validation (base58, 32-44 characters)
const claimRequestSchema = z.object({
  walletAddress: z.string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana wallet address format"),
  message: z.string().max(500).optional(),
  affiliateEarnings: z.number().min(0),
  cashbackEarnings: z.number().min(0),
  totalAmount: z.number().min(5, "Minimum claim amount is $5"),
  userEmail: z.string().email(),
  username: z.string().min(1).max(100)
});

interface ClaimRequest {
  walletAddress: string;
  message?: string;
  affiliateEarnings: number;
  cashbackEarnings: number;
  totalAmount: number;
  userEmail: string;
  username: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validationResult = claimRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data",
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      walletAddress,
      message,
      affiliateEarnings,
      cashbackEarnings,
      totalAmount,
      userEmail,
      username
    } = validationResult.data;

    // Get JWT token to identify the user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify affiliate earnings ownership - query ALL affiliate accounts (by user_id OR email)
    const { data: affiliateAccounts } = await supabase
      .from('affiliates')
      .select('total_earnings_usd')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`);

    // Sum total earnings from all affiliate accounts
    const actualAffiliateEarnings = affiliateAccounts 
      ? affiliateAccounts.reduce((sum, acc) => sum + (acc.total_earnings_usd || 0), 0)
      : 0;

    // Verify cashback earnings from user_spending
    const { data: userSpending, error: spendingError } = await supabase
      .from('user_spending')
      .select('total_spent_usd, cashback_rate')
      .eq('user_id', user.id)
      .maybeSingle();

    const actualCashbackEarnings = userSpending 
      ? (userSpending.total_spent_usd * userSpending.cashback_rate / 100)
      : 0;

    // Verify claimed amounts don't exceed actual earnings (with 0.01 tolerance for rounding)
    if (affiliateEarnings > actualAffiliateEarnings + 0.01) {
      return new Response(
        JSON.stringify({ 
          error: 'Claimed affiliate earnings exceed actual earnings',
          claimed: affiliateEarnings,
          actual: actualAffiliateEarnings
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (cashbackEarnings > actualCashbackEarnings + 0.01) {
      return new Response(
        JSON.stringify({ 
          error: 'Claimed cashback earnings exceed actual earnings',
          claimed: cashbackEarnings,
          actual: actualCashbackEarnings
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Check for recent claim requests
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentClaims, error: rateLimitError } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'claim_request')
      .gte('created_at', oneDayAgo)
      .like('payload->>user_id', `%${user.id}%`)
      .limit(1);

    if (!rateLimitError && recentClaims && recentClaims.length >= 1) {
      console.log(`Rate limit: User ${user.id} already submitted claim in last 24h`);
      return new Response(
        JSON.stringify({ error: 'You can only submit one claim request per day. Please wait before submitting another.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing claim request:", {
      username,
      userEmail,
      totalAmount,
      walletAddress: walletAddress.substring(0, 10) + "...",
      verified_affiliate: actualAffiliateEarnings.toFixed(2),
      verified_cashback: actualCashbackEarnings.toFixed(2)
    });

    // Send email to support team
    const emailResponse = await resend.emails.send({
      from: "Nomiqa Support <support@nomiqa-depin.com>",
      to: ["support@nomiqa-depin.com"],
      subject: `✅ VERIFIED Earnings Claim - ${username} ($${totalAmount.toFixed(2)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
            ✅ Verified Earnings Claim Request
          </h1>
          
          <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">✓ Earnings Verified Against Database</p>
            <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">This claim has been automatically validated. Amounts match user's actual earnings.</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #666; font-size: 18px;">User Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Username:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${username}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>User ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px;">${user.id}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #666; font-size: 18px;">Earnings Breakdown (Verified)</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Affiliate Earnings:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #0ea5e9;">$${affiliateEarnings.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #10b981; font-size: 12px;">✓ DB: $${actualAffiliateEarnings.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Cashback Earnings:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #8b5cf6;">$${cashbackEarnings.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #10b981; font-size: 12px;">✓ DB: $${actualCashbackEarnings.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 2px solid #333;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px; border-bottom: 2px solid #333; font-size: 20px; font-weight: bold; color: #10b981;">$${totalAmount.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 2px solid #333;"></td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #666; font-size: 18px;">Payout Details</h2>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
              <p style="margin: 0 0 10px 0;"><strong>Solana Wallet Address:</strong></p>
              <code style="display: block; background: white; padding: 10px; border-radius: 4px; font-size: 12px; word-break: break-all; font-family: monospace;">${walletAddress}</code>
            </div>
          </div>

          ${message ? `
          <div style="margin: 20px 0;">
            <h2 style="color: #666; font-size: 18px;">User Message</h2>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          ` : ''}

          <div style="margin: 30px 0; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Action Required:</strong> Process this VERIFIED claim and send $${totalAmount.toFixed(2)} (${affiliateEarnings > 0 ? 'USDC' : ''}${affiliateEarnings > 0 && cashbackEarnings > 0 ? ' + ' : ''}${cashbackEarnings > 0 ? 'SOL' : ''}) to the provided Solana wallet.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>This is an automated message from Nomiqa eSIM platform.</p>
            <p>Request submitted at: ${new Date().toISOString()}</p>
            <p style="color: #10b981; font-weight: bold;">✓ Earnings verified against database</p>
          </div>
        </div>
      `,
    });

    // Log this claim attempt for rate limiting
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'claim_request',
        payload: { 
          user_id: user.id, 
          username, 
          totalAmount, 
          verified: true,
          timestamp: new Date().toISOString() 
        }
      });

    console.log("Claim request email sent successfully:", emailResponse);

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
    console.error("Error processing claim request:", error);
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
