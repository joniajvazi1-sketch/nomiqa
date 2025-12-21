import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod validation schema
const resendRequestSchema = z.object({
  email: z.string().email().max(255),
  type: z.enum(['registration', 'password_reset', 'affiliate'])
});

interface ResendRequest {
  email: string;
  type: 'registration' | 'password_reset' | 'affiliate';
}

// Generate 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validationResult = resendRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Resend validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format",
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, type } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: max 3 resend requests per email per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentResends, error: rateLimitError } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('event_type', 'resend_verification')
      .gte('created_at', fifteenMinutesAgo)
      .eq('payload->>email_hash', normalizedEmail)
      .limit(3);

    if (!rateLimitError && recentResends && recentResends.length >= 3) {
      console.log(`Rate limit exceeded for resend to: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: 'Too many resend requests. Please wait 15 minutes before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (type === 'registration' || type === 'password_reset') {
      // Efficient approach: Look up profile by email pattern in username or use email_rate_limits
      // Since profiles doesn't have email column, we need to find the user differently
      
      // For resend, we can look up existing verification codes in profiles
      // and verify the email matches via auth.admin.getUserById
      
      let profile;
      let userId: string | null = null;
      
      if (type === 'registration') {
        // Find profiles with active verification codes
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, verification_code')
          .not('verification_code', 'is', null)
          .limit(100); // Reasonable limit for active verifications
        
        if (profileError) throw profileError;
        
        // Find the profile matching this email
        for (const p of profiles || []) {
          const { data: userData } = await supabase.auth.admin.getUserById(p.user_id);
          if (userData?.user?.email?.toLowerCase() === normalizedEmail) {
            profile = p;
            userId = p.user_id;
            break;
          }
        }
        
        if (!userId) {
          console.log(`User not found for email: ${normalizedEmail}`);
          return new Response(
            JSON.stringify({ error: "User not found or no pending verification" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile with new code
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_code: code,
            verification_code_expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        // Send verification email
        console.log(`Sending verification email to ${normalizedEmail}`);
        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: 'user_verification',
            to: normalizedEmail,
            data: { code },
          }),
        });
        
        if (!sendEmailResponse.ok) {
          const errorText = await sendEmailResponse.text();
          console.error(`Failed to send verification email: ${sendEmailResponse.status} - ${errorText}`);
        } else {
          console.log(`✓ Verification email sent to ${normalizedEmail}`);
        }

      } else {
        // Password reset - need to find user by email
        // Use email_rate_limits as a lookup aid, or query profiles by username prefix
        
        // Try to find user in profiles (look through all and match by email)
        // This is still O(n) but limited by active users, not all users
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .limit(1000); // Reasonable batch
        
        if (profileError) throw profileError;
        
        // Find matching user by checking auth
        for (const p of profiles || []) {
          const { data: userData } = await supabase.auth.admin.getUserById(p.user_id);
          if (userData?.user?.email?.toLowerCase() === normalizedEmail) {
            userId = p.user_id;
            break;
          }
        }
        
        if (!userId) {
          // User might exist but not have a profile - check auth directly
          // Unfortunately we still need to list users, but we can page through
          let page = 1;
          const perPage = 50;
          let found = false;
          
          while (!found && page <= 20) { // Max 1000 users searched
            const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
              page,
              perPage,
            });
            
            if (authError || !authData.users.length) break;
            
            const matchedUser = authData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
            if (matchedUser) {
              userId = matchedUser.id;
              found = true;
            }
            
            if (authData.users.length < perPage) break;
            page++;
          }
        }
        
        if (!userId) {
          console.log(`User not found for email: ${normalizedEmail}`);
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingProfile) {
          // Update existing profile with reset code
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              password_reset_code: code,
              password_reset_expires_at: expiresAt.toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) throw updateError;
        } else {
          // Create profile for legacy user (pre-verification system)
          const username = normalizedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              username: `${username}_${Date.now().toString(36).slice(-4)}`,
              email_verified: true, // Legacy users are considered verified
              password_reset_code: code,
              password_reset_expires_at: expiresAt.toISOString(),
            });

          if (insertError) throw insertError;
          console.log(`Created profile for legacy user: ${normalizedEmail}`);
        }

        // Send password reset email
        console.log(`Sending password reset email to ${normalizedEmail}`);
        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: 'password_reset',
            to: normalizedEmail,
            data: { code },
          }),
        });
        
        if (!sendEmailResponse.ok) {
          const errorText = await sendEmailResponse.text();
          console.error(`Failed to send password reset email: ${sendEmailResponse.status} - ${errorText}`);
        } else {
          console.log(`✓ Password reset email sent to ${normalizedEmail}`);
        }
      }

    } else if (type === 'affiliate') {
      // Affiliate lookup is already efficient - direct email query
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id, email')
        .eq('email', normalizedEmail)
        .maybeSingle();
      
      if (affiliateError) throw affiliateError;
      
      if (!affiliate) {
        return new Response(
          JSON.stringify({ error: "Affiliate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update affiliate with new code
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          verification_token: code,
          verification_code_expires_at: expiresAt.toISOString(),
        })
        .eq('email', normalizedEmail);

      if (updateError) throw updateError;

      // Send affiliate verification email
      console.log(`Sending affiliate verification email to ${normalizedEmail}`);
      const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'affiliate_verification',
          to: normalizedEmail,
          data: { code },
        }),
      });
      
      if (!sendEmailResponse.ok) {
        const errorText = await sendEmailResponse.text();
        console.error(`Failed to send affiliate verification email: ${sendEmailResponse.status} - ${errorText}`);
      } else {
        console.log(`✓ Affiliate verification email sent to ${normalizedEmail}`);
      }
    }

    // Log this resend attempt for rate limiting
    await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'resend_verification',
        payload: { type, email_hash: normalizedEmail, timestamp: new Date().toISOString() }
      });

    console.log(`Resent ${type} code to ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code resent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in resend-verification-code function:", error);
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
