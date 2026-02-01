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
  sendWelcomeOnly: z.boolean().optional(), // Flag to only send welcome email
});

// Cryptographically secure code generation
const generateSecureCode = (): string => {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    byte.toString(36).padStart(2, '0')
  ).join('').toUpperCase().substring(0, 10);
};

// Hash a code using SHA-256
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    const { email, username, userId, sendWelcomeOnly } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If only sending welcome email (for OAuth registrations), do that and return
    if (sendWelcomeOnly) {
      try {
        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: 'early_member_welcome',
            to: email,
            data: { username: email.split('@')[0] },
          }),
        });

        if (!sendEmailResponse.ok) {
          console.error('Failed to send welcome email for OAuth user');
        } else {
          console.log('Welcome email sent successfully for OAuth user:', email);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Welcome email sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to send welcome email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if username already exists in affiliates (if provided)
    if (username) {
      const { data: existingUsername } = await supabase
        .from('affiliates')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (existingUsername) {
        return new Response(
          JSON.stringify({ error: 'This username is already taken. Please choose a different one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

    // Check if user is already verified (either via profile or existing verified affiliate)
    let isUserVerified = false;

    if (userId) {
      // Check if user's profile email is verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile?.email_verified) {
        isUserVerified = true;
      }

      // Also check if user has any verified affiliate account
      if (!isUserVerified) {
        const { data: verifiedAffiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('user_id', userId)
          .eq('email_verified', true)
          .limit(1)
          .maybeSingle();

        if (verifiedAffiliate) {
          isUserVerified = true;
        }
      }

      // Check if there are any unverified affiliates for this email without user_id that we can link
      const { data: unlinkedAffiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('email', email)
        .is('user_id', null)
        .maybeSingle();

      if (unlinkedAffiliate) {
        // Link the unverified affiliate to this user
        const { error: updateError } = await supabase
          .from('affiliates')
          .update({ 
            user_id: userId,
            // If user is verified, also verify this affiliate
            ...(isUserVerified ? { email_verified: true, status: 'active' } : {})
          })
          .eq('id', unlinkedAffiliate.id);
        
        if (updateError) {
          console.error('Error linking user_id to affiliate:', updateError);
        }
        
        return new Response(
          JSON.stringify({ 
            affiliate: { 
              ...unlinkedAffiliate, 
              user_id: userId,
              ...(isUserVerified ? { email_verified: true, status: 'active' } : {})
            },
            requiresVerification: !isUserVerified && !unlinkedAffiliate.email_verified,
            message: 'Existing affiliate account linked to your user profile'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
        .maybeSingle();
      
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

    // If user is already verified, skip verification process
    if (isUserVerified) {
      // Create affiliate account directly without verification
      const { data: affiliate, error: createError } = await supabase
        .from('affiliates')
        .insert({
          email,
          affiliate_code: affiliateCode,
          username: username ? username.toLowerCase() : null,
          user_id: userId || null,
          email_verified: true,
          status: 'active',
          verification_token: null,
          verification_code_expires_at: null,
          verification_sent_at: null,
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

      console.log('Created verified affiliate for already-verified user:', affiliate.id);

      return new Response(
        JSON.stringify({ 
          affiliate,
          requiresVerification: false,
          message: 'Affiliate account created successfully!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User not verified - create with verification flow
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedVerificationCode = await hashCode(verificationCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: affiliate, error: createError } = await supabase
      .from('affiliates')
      .insert({
        email,
        affiliate_code: affiliateCode,
        username: username ? username.toLowerCase() : null,
        user_id: userId || null,
        email_verified: false,
        verification_token: hashedVerificationCode,
        verification_code_expires_at: expiresAt,
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

    // Send verification email with OTP code using direct HTTP call
    try {
      const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'affiliate_verification',
          to: email,
          data: { code: verificationCode },
        }),
      });

      if (!sendEmailResponse.ok) {
        console.error('Failed to send affiliate verification email');
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        affiliate,
        requiresVerification: true,
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
