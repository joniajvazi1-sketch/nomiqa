import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Privacy-safe client error logging endpoint
 * Stores minimal diagnostic info to help debug production issues
 * NO PII: no emails, no full IPs, no auth tokens, no query params
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize input
    const {
      type = "unknown",        // "js_error" | "unhandled_rejection" | "boot_timeout" | "chunk_load_error"
      message = "",            // Error message (truncated)
      stack = "",              // Stack trace hash or first line only
      route = "",              // Current route path (no query params)
      buildVersion = "",       // From version.txt
      userAgent = "",          // Browser/device (truncated)
      timestamp = Date.now(),
    } = body;

    // Sanitize: remove potential PII from message/stack
    const sanitizeString = (str: string, maxLen: number): string => {
      if (!str || typeof str !== "string") return "";
      // Remove URLs with query params, emails, tokens
      return str
        .replace(/[?&][^=\s]+=[^\s&]*/g, "[REDACTED]")
        .replace(/[\w.-]+@[\w.-]+/g, "[EMAIL]")
        .replace(/Bearer\s+[\w.-]+/gi, "[TOKEN]")
        .replace(/eyJ[\w.-]+/g, "[JWT]")
        .slice(0, maxLen);
    };

    const sanitizedError = {
      type: String(type).slice(0, 50),
      message: sanitizeString(message, 500),
      stackHash: stack ? hashString(sanitizeString(stack, 1000)) : null,
      route: sanitizeString(route, 100).split("?")[0], // Strip query params
      buildVersion: String(buildVersion).slice(0, 50),
      userAgent: String(userAgent).slice(0, 200),
      timestamp: new Date(timestamp).toISOString(),
      receivedAt: new Date().toISOString(),
    };

    // Log to console (Lovable can see these in edge function logs)
    console.log("[CLIENT_ERROR]", JSON.stringify(sanitizedError));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[log-client-error] Parse error:", err);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Simple hash for stack traces (deterministic, not cryptographic)
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
