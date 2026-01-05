/**
 * Data Quality Scoring System
 * 
 * Calculates a 0-100 quality score for signal log entries
 * Higher scores = more valuable data for telcos = more token rewards
 * 
 * Scoring factors:
 * - Network type (5G > LTE > 3G > 2G)
 * - Location context (indoor/rare locations bonus)
 * - Metric completeness (more fields = higher score)
 * - GPS accuracy
 * - Speed test inclusion
 */

export interface SignalLogForScoring {
  network_type?: string | null;
  accuracy_meters?: number | null;
  rsrp?: number | null;
  rsrq?: number | null;
  sinr?: number | null;
  rssi?: number | null;
  cell_id?: string | null;
  mcc?: string | null;
  mnc?: string | null;
  carrier_name?: string | null;
  speed_test_down?: number | null;
  speed_test_up?: number | null;
  latency_ms?: number | null;
  band_number?: number | null;
  frequency_mhz?: number | null;
  latitude: number;
  longitude: number;
  is_indoor?: boolean;
  is_rare_location?: boolean;
}

interface ScoringBreakdown {
  networkTypeScore: number;
  metricsCompletenessScore: number;
  locationAccuracyScore: number;
  speedTestScore: number;
  contextBonusScore: number;
  totalScore: number;
}

/**
 * Network type value weights (5G is most valuable)
 */
const NETWORK_TYPE_SCORES: Record<string, number> = {
  '5G SA': 25,
  '5G_SA': 25,
  '5G NSA': 22,
  '5G_NSA': 22,
  '5G': 20,
  'LTE-A': 15,
  'LTE_A': 15,
  'LTE': 12,
  '4G': 12,
  'HSPA+': 8,
  '3G': 5,
  '2G': 2,
  'WiFi': 0, // WiFi data not valuable for telcos
  'Unknown': 3,
};

/**
 * Calculate the data quality score for a signal log entry
 */
export function calculateDataQualityScore(log: SignalLogForScoring): ScoringBreakdown {
  let networkTypeScore = 0;
  let metricsCompletenessScore = 0;
  let locationAccuracyScore = 0;
  let speedTestScore = 0;
  let contextBonusScore = 0;

  // 1. Network Type Score (max 25 points)
  const networkType = log.network_type?.toUpperCase().replace(/ /g, '_') || 'Unknown';
  networkTypeScore = NETWORK_TYPE_SCORES[networkType] || NETWORK_TYPE_SCORES['Unknown'];

  // 2. Metrics Completeness Score (max 30 points)
  const metricsPresent = [
    log.rsrp !== null && log.rsrp !== undefined,
    log.rsrq !== null && log.rsrq !== undefined,
    log.sinr !== null && log.sinr !== undefined,
    log.rssi !== null && log.rssi !== undefined,
    log.cell_id !== null && log.cell_id !== undefined,
    log.mcc !== null && log.mcc !== undefined,
    log.mnc !== null && log.mnc !== undefined,
    log.carrier_name !== null && log.carrier_name !== undefined,
    log.band_number !== null && log.band_number !== undefined,
    log.frequency_mhz !== null && log.frequency_mhz !== undefined,
  ];
  
  const metricsCount = metricsPresent.filter(Boolean).length;
  metricsCompletenessScore = Math.round((metricsCount / 10) * 30);

  // 3. Location Accuracy Score (max 15 points)
  if (log.accuracy_meters !== null && log.accuracy_meters !== undefined) {
    if (log.accuracy_meters <= 5) {
      locationAccuracyScore = 15; // Excellent accuracy
    } else if (log.accuracy_meters <= 10) {
      locationAccuracyScore = 12;
    } else if (log.accuracy_meters <= 20) {
      locationAccuracyScore = 10;
    } else if (log.accuracy_meters <= 50) {
      locationAccuracyScore = 7;
    } else if (log.accuracy_meters <= 100) {
      locationAccuracyScore = 4;
    } else {
      locationAccuracyScore = 1; // Very poor accuracy
    }
  } else {
    locationAccuracyScore = 5; // Unknown accuracy gets mid score
  }

  // 4. Speed Test Score (max 15 points)
  if (log.speed_test_down !== null && log.speed_test_down !== undefined) {
    speedTestScore += 5;
    // Bonus for high speed connections (indicates capacity, valuable data)
    if (log.speed_test_down >= 100) {
      speedTestScore += 5;
    } else if (log.speed_test_down >= 50) {
      speedTestScore += 3;
    } else if (log.speed_test_down >= 20) {
      speedTestScore += 1;
    }
  }
  
  if (log.speed_test_up !== null && log.speed_test_up !== undefined) {
    speedTestScore += 3;
  }
  
  if (log.latency_ms !== null && log.latency_ms !== undefined) {
    speedTestScore += 2;
    // Bonus for low latency (< 20ms)
    if (log.latency_ms < 20) {
      speedTestScore += 2;
    }
  }
  
  speedTestScore = Math.min(speedTestScore, 15); // Cap at 15

  // 5. Context Bonus Score (max 15 points)
  // Indoor bonus (GPS accuracy > 30m often indicates indoor)
  if (log.is_indoor || (log.accuracy_meters && log.accuracy_meters > 30)) {
    contextBonusScore += 8; // Indoor 5G data is rare and valuable
  }
  
  // Rare location bonus (set by backend based on grid density)
  if (log.is_rare_location) {
    contextBonusScore += 7; // Data from uncovered areas is very valuable
  }
  
  contextBonusScore = Math.min(contextBonusScore, 15);

  // Calculate total (max 100)
  const totalScore = Math.min(
    networkTypeScore + 
    metricsCompletenessScore + 
    locationAccuracyScore + 
    speedTestScore + 
    contextBonusScore,
    100
  );

  return {
    networkTypeScore,
    metricsCompletenessScore,
    locationAccuracyScore,
    speedTestScore,
    contextBonusScore,
    totalScore,
  };
}

/**
 * Calculate reward multiplier based on quality score
 * Score 0-50: 1.0x (base rewards)
 * Score 51-70: 1.25x
 * Score 71-85: 1.5x
 * Score 86-100: 2.0x (premium data)
 */
export function getRewardMultiplier(qualityScore: number): number {
  if (qualityScore >= 86) return 2.0;
  if (qualityScore >= 71) return 1.5;
  if (qualityScore >= 51) return 1.25;
  return 1.0;
}

/**
 * Get human-readable quality tier
 */
export function getQualityTier(qualityScore: number): {
  tier: 'Basic' | 'Standard' | 'Premium' | 'Elite';
  color: string;
  description: string;
} {
  if (qualityScore >= 86) {
    return {
      tier: 'Elite',
      color: 'text-neon-violet',
      description: 'Exceptional telco-grade data with full metrics'
    };
  }
  if (qualityScore >= 71) {
    return {
      tier: 'Premium',
      color: 'text-neon-cyan',
      description: 'High-quality data with most metrics'
    };
  }
  if (qualityScore >= 51) {
    return {
      tier: 'Standard',
      color: 'text-green-400',
      description: 'Good data with core metrics'
    };
  }
  return {
    tier: 'Basic',
    color: 'text-muted-foreground',
    description: 'Basic coverage data'
  };
}
