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

// Generate a hash for logging (don't log full tokens)
function hashToken(token: string): string {
  const first4 = token.substring(0, 4);
  const last4 = token.substring(token.length - 4);
  return `${first4}...${last4}`;
}

// Mask email for logging
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '**';
  return `${maskedLocal}@${domain}`;
}

serve(async (req) => {
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
      // Log invalid access attempt
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_invalid_input',
        payload: { 
          ip: clientIP, 
          userAgent: userAgent.substring(0, 100),
          errors: validationResult.error.issues.map(i => i.message)
        }
      });
      
      return new Response(
        JSON.stringify({ error: 'Invalid access token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken, emailHint } = validationResult.data;
    const tokenHash = hashToken(accessToken);

    // Rate limiting: Check recent attempts from IP (stricter limit)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'order_access_attempt')
      .ilike('payload->>ip', clientIP)
      .gte('created_at', fifteenMinutesAgo);

    // Stricter rate limit: 5 attempts per 15 minutes per IP
    if (recentAttempts && recentAttempts.length >= 5) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      
      // Log rate limit hit
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_rate_limited',
        payload: { ip: clientIP, attempts: recentAttempts.length }
      });
      
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again in 15 minutes.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.log(`Order not found for token: ${tokenHash}`);
      
      // Log failed lookup (potential enumeration attempt)
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_not_found',
        payload: { ip: clientIP, tokenHash }
      });
      
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired or invalidated
    if (order.access_token_invalidated) {
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_invalidated',
        payload: { ip: clientIP, tokenHash, orderId: order.id }
      });
      
      return new Response(
        JSON.stringify({ error: 'Access token has been invalidated' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.access_token_expires_at && new Date(order.access_token_expires_at) < new Date()) {
      await supabase.from('webhook_logs').insert({
        event_type: 'order_access_expired',
        payload: { ip: clientIP, tokenHash, orderId: order.id }
      });
      
      return new Response(
        JSON.stringify({ error: 'Access token has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email verification check (optional but recommended for enhanced security)
    // If emailHint is provided, verify it matches the order email (case-insensitive)
    if (emailHint) {
      const orderEmailLower = order.email.toLowerCase();
      const hintEmailLower = emailHint.toLowerCase();
      
      if (orderEmailLower !== hintEmailLower) {
        console.log(`Email mismatch for order ${order.id}: expected ${maskEmail(order.email)}, got ${maskEmail(emailHint)}`);
        
        await supabase.from('webhook_logs').insert({
          event_type: 'order_access_email_mismatch',
          payload: { 
            ip: clientIP, 
            tokenHash, 
            orderId: order.id,
            providedEmailMask: maskEmail(emailHint)
          }
        });
        
        return new Response(
          JSON.stringify({ error: 'Email verification failed' }),
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

    console.log(`Order ${order.id} accessed successfully from IP ${clientIP}`);

    return new Response(
      JSON.stringify({ order, usage: usageData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    
    // Log error
    await supabase.from('webhook_logs').insert({
      event_type: 'order_access_error',
      payload: { 
        ip: clientIP, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});