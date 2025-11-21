import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // System prompt with Nomiqa knowledge
    const systemPrompt = `You are Nomiqa's AI support assistant. You help customers with questions about our eSIM service.

KEY INFORMATION:
- Coverage: 190+ countries worldwide
- Privacy-focused: No ID checks, no surveillance, anonymous purchases
- Payment: Crypto-only (SOL, USDC, $NOMIQA token on Solana blockchain)
- Loyalty Program: Bronze (5%), Silver (6% at $20), Gold (7% at $50), Platinum (10% at $150) cashback
- Affiliate Program: 9% commission + multi-level (6% layer 2, 3% layer 3)
- Device Requirements: eSIM-compatible, unlocked, not jailbroken/rooted

COMMON QUESTIONS:
- How to buy: Get Phantom wallet → Buy SOL/USDC → Shop for eSIM → Pay with crypto → Instant activation
- Compatibility: Most modern iPhones (XS+), Google Pixels, Samsung Galaxy (S20+), check our compatibility list
- Activation: Scan QR code or manual installation, instant activation after payment
- Support: Email support@nomiqa.com for 24/7 help

TONE: Friendly, helpful, concise. Always respond in the user's language (${language}).
If you don't know something, direct them to support@nomiqa.com.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please contact support@nomiqa.com" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again or email support@nomiqa.com" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-support error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
