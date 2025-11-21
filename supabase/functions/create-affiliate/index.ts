import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createAffiliateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  userId: z.string().uuid().optional(),
});

// Cryptographically secure code generation
const generateSecureCode = (): string => {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    byte.toString(36).padStart(2, '0')
  ).join('').toUpperCase().substring(0, 10);
};

// Generate verification token
const generateVerificationToken = (): string => {
  return crypto.randomUUID();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = createAffiliateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, username, userId } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: max 3 affiliate creation attempts per email per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: rateLimitError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .gte('created_at', oneDayAgo);

    if (!rateLimitError && recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many affiliate accounts created for this email. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already has an affiliate account
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'An affiliate account already exists for this email' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure affiliate code
    let affiliateCode = generateSecureCode();
    
    // Ensure code is unique
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const { data } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .single();
      
      if (!data) {
        codeExists = false;
      } else {
        affiliateCode = generateSecureCode();
        attempts++;
      }
    }

    if (codeExists) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique affiliate code. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create affiliate account
    const { data: affiliate, error: createError } = await supabase
      .from('affiliates')
      .insert({
        email,
        affiliate_code: affiliateCode,
        username: username || null,
        user_id: userId || null,
        email_verified: false,
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating affiliate:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create affiliate account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Send verification email
    // For now, auto-verify for development
    await supabase
      .from('affiliates')
      .update({ email_verified: true })
      .eq('id', affiliate.id);

    return new Response(
      JSON.stringify({ 
        affiliate: {
          ...affiliate,
          email_verified: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
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
