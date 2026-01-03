import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContributionData {
  session_id?: string;
  latitude: number;
  longitude: number;
  signal_dbm?: number;
  network_type?: string;
  carrier?: string;
  device_type?: string;
  speed_mps?: number;
  accuracy_meters?: number;
  recorded_at: string;
}

interface SyncRequest {
  contributions: ContributionData[];
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  suspicionScore: number;
}

// Validation constants
const MAX_ACCURACY_METERS = 100; // Reject readings with accuracy > 100m
const MAX_SPEED_MPS = 150; // ~540 km/h - faster than commercial aircraft
const MIN_TIME_BETWEEN_POINTS_MS = 500; // Minimum 0.5s between points
const MAX_DISTANCE_PER_SECOND_METERS = 200; // ~720 km/h max travel speed
const DUPLICATE_THRESHOLD_METERS = 0.5; // Points closer than this are duplicates
const SUSPICIOUS_PATTERN_THRESHOLD = 5; // Number of flags before rejection

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Validate a single contribution point
function validateContribution(
  contribution: ContributionData,
  previousContribution?: ContributionData,
  recentHistory?: ContributionData[]
): ValidationResult {
  let suspicionScore = 0;
  const reasons: string[] = [];

  // 1. Check GPS accuracy
  if (contribution.accuracy_meters && contribution.accuracy_meters > MAX_ACCURACY_METERS) {
    suspicionScore += 2;
    reasons.push(`Low GPS accuracy: ${contribution.accuracy_meters}m`);
  }

  // 2. Check for impossible coordinates
  if (Math.abs(contribution.latitude) > 90 || Math.abs(contribution.longitude) > 180) {
    return { valid: false, reason: 'Invalid coordinates', suspicionScore: 10 };
  }

  // 3. Check for null island (0,0) or obviously fake coordinates
  if (contribution.latitude === 0 && contribution.longitude === 0) {
    return { valid: false, reason: 'Null island coordinates detected', suspicionScore: 10 };
  }

  // 4. Check reported speed against maximum
  if (contribution.speed_mps && contribution.speed_mps > MAX_SPEED_MPS) {
    suspicionScore += 3;
    reasons.push(`Impossible speed: ${contribution.speed_mps} m/s`);
  }

  // 5. Validate against previous point if available
  if (previousContribution) {
    const timeDiffMs = new Date(contribution.recorded_at).getTime() - 
                       new Date(previousContribution.recorded_at).getTime();
    
    // Check minimum time between points
    if (timeDiffMs < MIN_TIME_BETWEEN_POINTS_MS && timeDiffMs >= 0) {
      suspicionScore += 1;
      reasons.push('Points recorded too quickly');
    }

    // Check for time travel (future to past)
    if (timeDiffMs < 0) {
      suspicionScore += 3;
      reasons.push('Time inconsistency detected');
    }

    // Calculate actual distance and speed
    const distance = calculateDistance(
      previousContribution.latitude, previousContribution.longitude,
      contribution.latitude, contribution.longitude
    );

    // Check for exact duplicates
    if (distance < DUPLICATE_THRESHOLD_METERS) {
      suspicionScore += 0.5;
      reasons.push('Duplicate location');
    }

    // Check calculated speed vs time
    if (timeDiffMs > 0) {
      const calculatedSpeedMps = (distance / timeDiffMs) * 1000;
      
      if (calculatedSpeedMps > MAX_DISTANCE_PER_SECOND_METERS) {
        suspicionScore += 4;
        reasons.push(`Impossible travel speed: ${calculatedSpeedMps.toFixed(1)} m/s`);
      }

      // Cross-check reported speed vs calculated speed (if reported)
      if (contribution.speed_mps) {
        const speedDiff = Math.abs(contribution.speed_mps - calculatedSpeedMps);
        if (speedDiff > 50 && calculatedSpeedMps > 10) {
          suspicionScore += 2;
          reasons.push('Speed mismatch between reported and calculated');
        }
      }
    }
  }

  // 6. Check for pattern-based spoofing in recent history
  if (recentHistory && recentHistory.length >= 3) {
    const bearings: number[] = [];
    for (let i = 1; i < recentHistory.length; i++) {
      const bearing = Math.atan2(
        recentHistory[i].longitude - recentHistory[i-1].longitude,
        recentHistory[i].latitude - recentHistory[i-1].latitude
      ) * 180 / Math.PI;
      bearings.push(bearing);
    }
    
    if (bearings.length >= 2) {
      const mean = bearings.reduce((a, b) => a + b, 0) / bearings.length;
      const bearingVariance = bearings.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / bearings.length;
      
      if (bearingVariance < 0.1) {
        suspicionScore += 2;
        reasons.push('Suspiciously linear movement pattern');
      }
    }

    const distances: number[] = [];
    for (let i = 1; i < recentHistory.length; i++) {
      distances.push(calculateDistance(
        recentHistory[i-1].latitude, recentHistory[i-1].longitude,
        recentHistory[i].latitude, recentHistory[i].longitude
      ));
    }
    
    if (distances.length >= 2) {
      const uniqueDistances = new Set(distances.map(d => Math.round(d * 10) / 10));
      if (uniqueDistances.size === 1 && distances[0] > 10) {
        suspicionScore += 2;
        reasons.push('Repeated identical distances');
      }
    }
  }

  const valid = suspicionScore < SUSPICIOUS_PATTERN_THRESHOLD;
  
  return {
    valid,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
    suspicionScore
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contributions }: SyncRequest = await req.json();

    if (!contributions || !Array.isArray(contributions) || contributions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No contributions to sync' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${contributions.length} contributions for user ${user.id}`);

    // Fetch recent contributions for pattern analysis
    const { data: recentContributions } = await supabase
      .from('offline_contribution_queue')
      .select('latitude, longitude, recorded_at, speed_mps, accuracy_meters')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(10);

    // Validate each contribution
    let validCount = 0;
    let rejectedCount = 0;
    let totalSuspicionScore = 0;
    const validContributions: ContributionData[] = [];
    const rejectionReasons: string[] = [];

    const sortedContributions = [...contributions].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const fullHistory: ContributionData[] = recentContributions?.map(c => ({
      latitude: c.latitude,
      longitude: c.longitude,
      recorded_at: c.recorded_at,
      speed_mps: c.speed_mps,
      accuracy_meters: c.accuracy_meters
    })) || [];

    for (let i = 0; i < sortedContributions.length; i++) {
      const contribution = sortedContributions[i];
      const previousContribution = i > 0 ? sortedContributions[i - 1] : fullHistory[0];
      const recentHistory = [...fullHistory.slice(-5), ...sortedContributions.slice(0, i).slice(-5)];

      const validation = validateContribution(contribution, previousContribution, recentHistory);
      totalSuspicionScore += validation.suspicionScore;

      if (validation.valid) {
        validContributions.push(contribution);
        validCount++;
        fullHistory.push(contribution);
      } else {
        rejectedCount++;
        if (validation.reason) {
          rejectionReasons.push(validation.reason);
        }
        console.log(`Rejected contribution: ${validation.reason} (score: ${validation.suspicionScore})`);
      }
    }

    const avgSuspicionScore = totalSuspicionScore / contributions.length;
    if (avgSuspicionScore > 3) {
      console.warn(`High suspicion score for user ${user.id}: ${avgSuspicionScore.toFixed(2)}`);
    }

    if (validContributions.length === 0) {
      console.log(`All ${contributions.length} contributions rejected for user ${user.id}`);
      return new Response(
        JSON.stringify({
          success: false,
          synced_count: 0,
          rejected_count: rejectedCount,
          points_earned: 0,
          message: 'All contributions failed validation',
          reasons: [...new Set(rejectionReasons)].slice(0, 5)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validated: ${validCount} valid, ${rejectedCount} rejected`);

    const totalPointsEarned = Math.floor(validContributions.length * 5);

    const queueItems = validContributions.map((c) => ({
      user_id: user.id,
      session_id: c.session_id || null,
      latitude: c.latitude,
      longitude: c.longitude,
      signal_dbm: c.signal_dbm,
      network_type: c.network_type,
      carrier: c.carrier,
      device_type: c.device_type,
      speed_mps: c.speed_mps,
      accuracy_meters: c.accuracy_meters,
      recorded_at: c.recorded_at,
      synced_at: new Date().toISOString(),
      processed: true
    }));

    const { error: insertError } = await supabase
      .from('offline_contribution_queue')
      .insert(queueItems);

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to sync contributions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const miningLogs = validContributions.map((c) => ({
      user_id: user.id,
      latitude: c.latitude,
      longitude: c.longitude,
      signal_dbm: c.signal_dbm,
      network_type: c.network_type,
      carrier: c.carrier,
      device_type: c.device_type
    }));

    await supabase.from('mining_logs').insert(miningLogs);

    const { data: existingPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPoints) {
      await supabase
        .from('user_points')
        .update({
          pending_points: (existingPoints.pending_points || 0) + totalPointsEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          total_points: 0,
          pending_points: totalPointsEarned,
          total_distance_meters: 0
        });
    }

    console.log(`Synced ${validContributions.length} contributions, earned ${totalPointsEarned} points`);

    return new Response(
      JSON.stringify({
        success: true,
        synced_count: validContributions.length,
        rejected_count: rejectedCount,
        points_earned: totalPointsEarned,
        validation_summary: {
          avg_suspicion_score: avgSuspicionScore.toFixed(2),
          rejection_reasons: [...new Set(rejectionReasons)].slice(0, 3)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
