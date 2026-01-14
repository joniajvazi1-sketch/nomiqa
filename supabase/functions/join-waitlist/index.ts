import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const waitlistSchema = z.object({
  email: z.string().email().max(255).transform(val => val.toLowerCase().trim()),
  source: z.string().max(50).optional().default("unknown"),
});

// Rate limit: 3 submissions per IP per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_IP = 3;

// Simple in-memory rate limiter (resets on function cold start, but provides basic protection)
const ipSubmissions = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const record = ipSubmissions.get(ipHash);
  
  if (!record) {
    ipSubmissions.set(ipHash, { count: 1, windowStart: now });
    return false;
  }
  
  // Reset window if expired
  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipSubmissions.set(ipHash, { count: 1, windowStart: now });
    return false;
  }
  
  // Check if over limit
  if (record.count >= MAX_SUBMISSIONS_PER_IP) {
    return true;
  }
  
  // Increment count
  record.count++;
  return false;
}

// Validate IP address format to prevent header spoofing
function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 validation (simplified - covers most common formats)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Extract and validate client IP from headers
function getValidatedClientIP(req: Request): string {
  const rawIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
               || req.headers.get("cf-connecting-ip") 
               || "unknown";
  
  // Return validated IP or "unknown" if format is invalid
  if (rawIP !== "unknown" && isValidIP(rawIP)) {
    return rawIP;
  }
  
  return "unknown";
}

// Hash IP for privacy
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "waitlist-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Email validation - reject disposable email domains
const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwaway.email", "mailinator.com", "guerrillamail.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "dispostable.com",
  "yopmail.com", "getnada.com", "trashmail.com", "tempail.com"
];

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.some(d => domain?.includes(d));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get and validate client IP for rate limiting
    const clientIP = getValidatedClientIP(req);
    const ipHash = await hashIP(clientIP);
    
    // Check rate limit
    if (isRateLimited(ipHash)) {
      console.log(`Rate limited: ${ipHash}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMITED"
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = waitlistSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid email address",
          code: "INVALID_EMAIL"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { email, source } = parseResult.data;

    // Check for disposable email
    if (isDisposableEmail(email)) {
      return new Response(
        JSON.stringify({ 
          error: "Please use a permanent email address",
          code: "DISPOSABLE_EMAIL"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize Supabase client with service role for insert
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Check if email already exists (to provide proper feedback)
    const { data: existing } = await supabaseAdmin
      .from("token_waitlist")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "You're already on the waitlist!",
          code: "ALREADY_EXISTS"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Insert into waitlist
    const { error: insertError } = await supabaseAdmin
      .from("token_waitlist")
      .insert({ 
        email, 
        source: source || "api" 
      });

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "You're already on the waitlist!",
            code: "ALREADY_EXISTS"
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      throw insertError;
    }

    console.log(`Waitlist signup: ${email.substring(0, 3)}***@${email.split("@")[1]} from ${source}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Welcome to the waitlist!",
        code: "SUCCESS"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Waitlist error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Something went wrong. Please try again.",
        code: "SERVER_ERROR"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
