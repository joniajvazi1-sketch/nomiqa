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
  totalAmount: z.number().min(5, "Minimum withdrawal is $5"),
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

    console.log("Processing claim request:", {
      username,
      userEmail,
      totalAmount,
      walletAddress: walletAddress.substring(0, 10) + "..."
    });

    // Send email to support team
    const emailResponse = await resend.emails.send({
      from: "Nomiqa Support <support@nomiqa-esim.com>",
      to: ["support@nomiqa-esim.com"],
      subject: `Earnings Claim Request - ${username} ($${totalAmount.toFixed(2)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
            New Earnings Claim Request
          </h1>
          
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
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #666; font-size: 18px;">Earnings Breakdown</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Affiliate Earnings:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #0ea5e9;">$${affiliateEarnings.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Cashback Earnings:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #8b5cf6;">$${cashbackEarnings.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 2px solid #333;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px; border-bottom: 2px solid #333; font-size: 20px; font-weight: bold; color: #10b981;">$${totalAmount.toFixed(2)}</td>
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
              <strong>Action Required:</strong> Please process this claim request and send the funds to the provided Solana wallet address.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>This is an automated message from Nomiqa eSIM platform.</p>
            <p>Request submitted at: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
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
