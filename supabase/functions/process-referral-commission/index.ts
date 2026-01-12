import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommissionRequest {
  user_id: string;
  points_earned: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, points_earned }: CommissionRequest = await req.json();

    if (!user_id || !points_earned || points_earned <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: user_id and positive points_earned required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing commission for user ${user_id}, points earned: ${points_earned}`);

    // Find if this user was referred by an affiliate
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .select('affiliate_id')
      .eq('registered_user_id', user_id)
      .eq('status', 'registered')
      .maybeSingle();

    if (referralError) {
      console.error('Error finding referral:', referralError);
      return new Response(
        JSON.stringify({ error: 'Failed to lookup referral' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!referral) {
      console.log('No referrer found for user');
      return new Response(
        JSON.stringify({ success: true, message: 'No referrer found', commission: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the referrer's user_id
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('user_id')
      .eq('id', referral.affiliate_id)
      .maybeSingle();

    if (affiliateError || !affiliate?.user_id) {
      console.log('Referrer has no linked user account');
      return new Response(
        JSON.stringify({ success: true, message: 'Referrer not linked to user account', commission: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const referrerUserId = affiliate.user_id;

    // Don't credit commission to yourself
    if (referrerUserId === user_id) {
      console.log('User cannot refer themselves');
      return new Response(
        JSON.stringify({ success: true, message: 'Self-referral not allowed', commission: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate 5% commission
    const commissionRate = 0.05;
    const commissionAmount = Math.max(1, Math.floor(points_earned * commissionRate));

    console.log(`Crediting ${commissionAmount} points to referrer ${referrerUserId}`);

    // Credit commission to referrer's user_points
    const { error: updateError } = await supabase
      .from('user_points')
      .upsert({
        user_id: referrerUserId,
        total_points: commissionAmount,
        pending_points: 0,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    // If upsert, we need to add to existing points
    if (!updateError) {
      const { data: currentPoints } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', referrerUserId)
        .single();

      if (currentPoints) {
        await supabase
          .from('user_points')
          .update({ 
            total_points: (currentPoints.total_points || 0) + commissionAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', referrerUserId);
      }
    }

    // Record the commission transaction
    const { error: logError } = await supabase
      .from('referral_commissions')
      .insert({
        referrer_user_id: referrerUserId,
        referred_user_id: user_id,
        points_earned: points_earned,
        commission_points: commissionAmount,
        commission_rate: commissionRate
      });

    if (logError) {
      console.error('Error logging commission:', logError);
    }

    console.log(`Commission processed successfully: ${commissionAmount} points to ${referrerUserId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        commission: commissionAmount,
        referrer_user_id: referrerUserId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing commission:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
