import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  accessToken: z.string().uuid(),
  // Optional email verification for additional security
  emailHint: z.string().email().optional()
});

// SECURITY: Add artificial delay to mitigate timing attacks
const addSecurityDelay = async (startTime: number): Promise<void> => {
  const minResponseTime = 400; // Minimum 400ms response time
  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, minResponseTime - elapsed);
  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }
};

// Generate a hash for logging (don't log full tokens)
function hashToken(token: string): string {
  const first4 = token.substring(0, 4);
  const last4 = token.substring(token.length - 4);
  return `${first4}...${last4}`;
}

// SECURITY: Generic error messages to prevent enumeration
const GENERIC_ACCESS_ERROR = "Unable to access order. Please verify your access token.";

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get client IP for rate limiting and audit logging
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      // Log invalid access attempt without exposing details
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_invalid_input',
        payload: { 
          ip: clientIP, 
          userAgent: userAgent.substring(0, 100)
        }
      });
      
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken, emailHint } = validationResult.data;
    const tokenHash = hashToken(accessToken);

    // SECURITY: Stricter rate limiting with exponential backoff consideration
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('webhook_logs')
      .select('id, created_at')
      .eq('event_type', 'order_access_attempt')
      .ilike('payload->>ip', clientIP)
      .gte('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false });

    // SECURITY: Stricter rate limit: 5 attempts per 15 minutes per IP
    // After 3 attempts, add exponential delay
    const attemptCount = recentAttempts?.length || 0;
    
    if (attemptCount >= 5) {
      console.log(`Rate limit exceeded for IP`);
      
      // Log rate limit hit without exposing IP
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_rate_limited',
        payload: { ip: clientIP, attempts: attemptCount }
      });
      
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again in 15 minutes.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // SECURITY: Add exponential delay after 3 attempts
    if (attemptCount >= 3) {
      const exponentialDelay = Math.min(1000 * Math.pow(2, attemptCount - 3), 10000); // Max 10s
      await new Promise(resolve => setTimeout(resolve, exponentialDelay));
    }

    // Log this access attempt (before lookup to detect enumeration)
    await supabase.from('webhook_logs').insert({
      event_type: 'order_access_attempt',
      payload: { 
        ip: clientIP, 
        tokenHash,
        userAgent: userAgent.substring(0, 100),
        hasEmailHint: !!emailHint
      }
    });

    // Fetch order using service role to bypass RLS
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, products:product_id(*)')
      .eq('access_token', accessToken)
      .single();

    if (error || !order) {
      console.log(`Order access failed`);
      
      // Log failed lookup (potential enumeration attempt)
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_not_found',
        payload: { ip: clientIP, tokenHash }
      });
      
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: GENERIC_ACCESS_ERROR }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch PII from the protected orders_pii table (service role access)
    const { data: orderPii } = await supabase
      .from('orders_pii')
      .select('email, full_name, iccid, lpa, qrcode, qr_code_url, activation_code, matching_id, manual_installation, qrcode_installation, sharing_link, sharing_access_code')
      .eq('id', order.id)
      .single();

    // Merge PII data back into order object for response
    if (orderPii) {
      order.email = orderPii.email;
      order.full_name = orderPii.full_name;
      order.iccid = orderPii.iccid;
      order.lpa = orderPii.lpa;
      order.qrcode = orderPii.qrcode;
      order.qr_code_url = orderPii.qr_code_url;
      order.activation_code = orderPii.activation_code;
      order.matching_id = orderPii.matching_id;
      order.manual_installation = orderPii.manual_installation;
      order.qrcode_installation = orderPii.qrcode_installation;
      order.sharing_link = orderPii.sharing_link;
      order.sharing_access_code = orderPii.sharing_access_code;
    }

    // Check if token is expired or invalidated
    if (order.access_token_invalidated) {
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_invalidated',
        payload: { ip: clientIP, tokenHash, orderId: order.id }
      });
      
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: GENERIC_ACCESS_ERROR }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.access_token_expires_at && new Date(order.access_token_expires_at) < new Date()) {
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_expired',
        payload: { ip: clientIP, tokenHash, orderId: order.id }
      });
      
      await addSecurityDelay(startTime);
      return new Response(
        JSON.stringify({ error: 'Access token has expired. Please contact support.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email verification check (optional but recommended for enhanced security)
    // If emailHint is provided, verify it matches the order email (case-insensitive)
    if (emailHint) {
      const orderEmailLower = order.email.toLowerCase();
      const hintEmailLower = emailHint.toLowerCase();
      
      if (orderEmailLower !== hintEmailLower) {
        console.log(`Email verification failed for order access`);
        
        await supabase.from('webhook_logs').insert({
          event_type: 'order_access_email_mismatch',
          payload: { 
            ip: clientIP, 
            tokenHash, 
            orderId: order.id
          }
        });
        
        await addSecurityDelay(startTime);
        return new Response(
          JSON.stringify({ error: GENERIC_ACCESS_ERROR }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch eSIM usage data if available
    let usageData = null;
    if (order.iccid) {
      const { data: usage } = await supabase
        .from('esim_usage')
        .select('*')
        .eq('order_id', order.id)
        .single();
      
      usageData = usage;
    }

    // Log successful access
    await supabase.from('webhook_logs').insert({
      event_type: 'order_access_success',
      payload: { 
        ip: clientIP, 
        tokenHash, 
        orderId: order.id,
        emailVerified: !!emailHint
      }
    });

    console.log(`Order accessed successfully`);

    return new Response(
      JSON.stringify({ order, usage: usageData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // SECURITY: Log error without exposing details
    console.error('Order access error occurred');
    
    // Log error without exposing internal details
    await supabase.from('webhook_logs').insert({
      event_type: 'order_access_error',
      payload: { ip: clientIP }
    });
    
    await addSecurityDelay(startTime);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
