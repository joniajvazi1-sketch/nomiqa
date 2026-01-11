import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[sync-affiliate-stats] Starting daily affiliate stats sync...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get all affiliates with their actual registration counts
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .select('id, username, total_registrations, registration_milestone_level, miner_boost_percentage');

    if (affiliatesError) {
      console.error('[sync-affiliate-stats] Error fetching affiliates:', affiliatesError);
      throw affiliatesError;
    }

    console.log(`[sync-affiliate-stats] Found ${affiliates?.length || 0} affiliates to check`);

    let updatedCount = 0;
    let discrepanciesFound = 0;
    const discrepancies: Array<{
      username: string;
      recorded: number;
      actual: number;
    }> = [];

    // Step 2: For each affiliate, count actual verified registrations
    for (const affiliate of affiliates || []) {
      const { count, error: countError } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_id', affiliate.id)
        .not('registered_user_id', 'is', null);

      if (countError) {
        console.error(`[sync-affiliate-stats] Error counting referrals for ${affiliate.username}:`, countError);
        continue;
      }

      const actualCount = count || 0;
      const recordedCount = affiliate.total_registrations || 0;

      // Calculate expected milestone level and boost
      let expectedLevel = 0;
      let expectedBoost = 0;

      if (actualCount >= 100) {
        expectedLevel = 5;
        expectedBoost = 100;
      } else if (actualCount >= 50) {
        expectedLevel = 4;
        expectedBoost = 70;
      } else if (actualCount >= 30) {
        expectedLevel = 3;
        expectedBoost = 40;
      } else if (actualCount >= 15) {
        expectedLevel = 2;
        expectedBoost = 20;
      } else if (actualCount >= 5) {
        expectedLevel = 1;
        expectedBoost = 10;
      }

      // Check if update needed
      const needsUpdate = 
        actualCount !== recordedCount ||
        expectedLevel !== affiliate.registration_milestone_level ||
        expectedBoost !== affiliate.miner_boost_percentage;

      if (needsUpdate) {
        discrepanciesFound++;
        
        if (actualCount !== recordedCount) {
          discrepancies.push({
            username: affiliate.username || 'unknown',
            recorded: recordedCount,
            actual: actualCount,
          });
          console.log(`[sync-affiliate-stats] Discrepancy for ${affiliate.username}: recorded=${recordedCount}, actual=${actualCount}`);
        }

        // Update the affiliate record
        const { error: updateError } = await supabase
          .from('affiliates')
          .update({
            total_registrations: actualCount,
            registration_milestone_level: expectedLevel,
            miner_boost_percentage: expectedBoost,
            updated_at: new Date().toISOString(),
          })
          .eq('id', affiliate.id);

        if (updateError) {
          console.error(`[sync-affiliate-stats] Error updating ${affiliate.username}:`, updateError);
        } else {
          updatedCount++;
          console.log(`[sync-affiliate-stats] Updated ${affiliate.username}: registrations=${actualCount}, level=${expectedLevel}, boost=${expectedBoost}%`);
        }
      }
    }

    // Step 3: Log the sync results
    const summary = {
      total_affiliates: affiliates?.length || 0,
      discrepancies_found: discrepanciesFound,
      affiliates_updated: updatedCount,
      discrepancy_details: discrepancies,
      sync_timestamp: new Date().toISOString(),
    };

    console.log('[sync-affiliate-stats] Sync complete:', JSON.stringify(summary));

    // Log to webhook_logs for audit trail
    await supabase.from('webhook_logs').insert({
      event_type: 'affiliate_stats_sync',
      payload: summary,
      processed: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...summary,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-affiliate-stats] Fatal error:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
