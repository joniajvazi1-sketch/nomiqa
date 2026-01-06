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
  device_fingerprint?: string;
}

interface SignalLogData {
  session_id?: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  altitude_meters?: number;
  speed_mps?: number;
  heading_degrees?: number;
  rsrp?: number;
  rsrq?: number;
  rssi?: number;
  sinr?: number;
  roaming_status?: boolean;
  speed_test_down?: number;
  speed_test_up?: number;
  latency_ms?: number;
  jitter_ms?: number;
  pci?: number;
  band_number?: number;
  frequency_mhz?: number;
  bandwidth_mhz?: number;
  recorded_at: string;
  data_quality_score?: number;
  is_indoor?: boolean;
  is_rare_location?: boolean;
  speed_test_error?: string;
  speed_test_provider?: string;
  latency_error?: string;
  latency_provider?: string;
  latency_method?: string;
  network_type?: string;
  carrier_name?: string;
  mcc?: string;
  mnc?: string;
  mcc_mnc?: string;
  device_model?: string;
  device_manufacturer?: string;
  os_version?: string;
  cell_id?: string;
  tac?: string;
}

interface LocationProof {
  proof_hash: string;
  proof_version: number;
  timestamp: string;
  location_hash: string;
  device_hash: string;
  network_hash: string;
}

// MCC to ISO country code mapping (major countries)
const MCC_TO_COUNTRY: Record<string, string> = {
  '202': 'GR', '204': 'NL', '206': 'BE', '208': 'FR', '214': 'ES', '216': 'HU',
  '218': 'BA', '220': 'RS', '222': 'IT', '226': 'RO', '228': 'CH', '230': 'CZ',
  '232': 'AT', '234': 'GB', '235': 'GB', '238': 'DK', '240': 'SE', '242': 'NO',
  '244': 'FI', '246': 'LT', '247': 'LV', '248': 'EE', '250': 'RU', '255': 'UA',
  '260': 'PL', '262': 'DE', '266': 'GI', '268': 'PT', '270': 'LU', '272': 'IE',
  '274': 'IS', '276': 'AL', '278': 'MT', '280': 'CY', '282': 'GE', '283': 'AM',
  '284': 'BG', '286': 'TR', '288': 'FO', '290': 'GL', '292': 'SM', '293': 'SI',
  '294': 'MK', '295': 'LI', '297': 'ME', '302': 'CA', '308': 'PM', '310': 'US',
  '311': 'US', '312': 'US', '313': 'US', '314': 'US', '315': 'US', '316': 'US',
  '330': 'PR', '334': 'MX', '338': 'JM', '340': 'GP', '342': 'BB', '344': 'AG',
  '346': 'KY', '348': 'VG', '350': 'BM', '352': 'GD', '354': 'MS', '356': 'KN',
  '358': 'LC', '360': 'VC', '362': 'CW', '363': 'AW', '364': 'BS', '365': 'AI',
  '366': 'DM', '368': 'CU', '370': 'DO', '372': 'HT', '374': 'TT', '376': 'TC',
  '400': 'AZ', '401': 'KZ', '402': 'BT', '404': 'IN', '405': 'IN', '406': 'IN',
  '410': 'PK', '412': 'AF', '413': 'LK', '414': 'MM', '415': 'LB', '416': 'JO',
  '417': 'SY', '418': 'IQ', '419': 'KW', '420': 'SA', '421': 'YE', '422': 'OM',
  '424': 'AE', '425': 'IL', '426': 'BH', '427': 'QA', '428': 'MN', '429': 'NP',
  '432': 'IR', '434': 'UZ', '436': 'TJ', '437': 'KG', '438': 'TM', '440': 'JP',
  '441': 'JP', '450': 'KR', '452': 'VN', '454': 'HK', '455': 'MO', '456': 'KH',
  '457': 'LA', '460': 'CN', '461': 'CN', '466': 'TW', '467': 'KP', '470': 'BD',
  '472': 'MV', '502': 'MY', '505': 'AU', '510': 'ID', '514': 'TL', '515': 'PH',
  '520': 'TH', '525': 'SG', '528': 'BN', '530': 'NZ', '536': 'NR', '537': 'PG',
  '539': 'TO', '540': 'SB', '541': 'VU', '542': 'FJ', '544': 'AS', '545': 'KI',
  '546': 'NC', '547': 'PF', '548': 'CK', '549': 'WS', '550': 'FM', '551': 'MH',
  '552': 'PW', '553': 'TV', '555': 'NU', '602': 'EG', '603': 'DZ', '604': 'MA',
  '605': 'TN', '606': 'LY', '607': 'GM', '608': 'SN', '609': 'MR', '610': 'ML',
  '611': 'GN', '612': 'CI', '613': 'BF', '614': 'NE', '615': 'TG', '616': 'BJ',
  '617': 'MU', '618': 'LR', '619': 'SL', '620': 'GH', '621': 'NG', '622': 'TD',
  '623': 'CF', '624': 'CM', '625': 'CV', '626': 'ST', '627': 'GQ', '628': 'GA',
  '629': 'CG', '630': 'CD', '631': 'AO', '632': 'GW', '633': 'SC', '634': 'SD',
  '635': 'RW', '636': 'ET', '637': 'SO', '638': 'DJ', '639': 'KE', '640': 'TZ',
  '641': 'UG', '642': 'BI', '643': 'MZ', '645': 'ZM', '646': 'MG', '647': 'RE',
  '648': 'ZW', '649': 'NA', '650': 'MW', '651': 'LS', '652': 'BW', '653': 'SZ',
  '654': 'KM', '655': 'ZA', '657': 'ER', '659': 'SS', '702': 'BZ', '704': 'GT',
  '706': 'SV', '708': 'HN', '710': 'NI', '712': 'CR', '714': 'PA', '716': 'PE',
  '722': 'AR', '724': 'BR', '730': 'CL', '732': 'CO', '734': 'VE', '736': 'BO',
  '738': 'GY', '740': 'EC', '742': 'GF', '744': 'PY', '746': 'SR', '748': 'UY',
  '750': 'FK'
};

// Network generation from network_type string
function deriveNetworkGeneration(networkType?: string): string | null {
  if (!networkType) return null;
  const upper = networkType.toUpperCase();
  if (upper.includes('5G') || upper.includes('NR')) return '5G';
  if (upper.includes('LTE') || upper.includes('4G')) return '4G';
  if (upper.includes('HSPA') || upper.includes('HSDPA') || upper.includes('HSUPA') || 
      upper.includes('UMTS') || upper.includes('3G') || upper.includes('WCDMA')) return '3G';
  if (upper.includes('EDGE') || upper.includes('GPRS') || upper.includes('2G') || 
      upper.includes('GSM') || upper.includes('CDMA')) return '2G';
  if (upper.includes('WIFI') || upper.includes('WI-FI')) return 'WiFi';
  return null;
}

// Derive country code from MCC
function deriveCountryFromMCC(mcc?: string): string | null {
  if (!mcc) return null;
  return MCC_TO_COUNTRY[mcc] || null;
}

// Generate geohash (precision 7 = ~153m x 153m)
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
function encodeGeohash(lat: number, lng: number, precision: number = 7): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isLng = true;

  while (hash.length < precision) {
    if (isLng) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isLng = !isLng;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

// Round coordinates to 4 decimals (~11m precision)
function roundCoord(value: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Generate SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a location proof for a contribution
async function generateLocationProof(
  userId: string,
  contribution: ContributionData,
  serverSecret: string
): Promise<LocationProof> {
  const timestamp = new Date().toISOString();
  const proofVersion = 1;

  const locationData = `${contribution.latitude.toFixed(4)}|${contribution.longitude.toFixed(4)}|${contribution.recorded_at}`;
  const locationHash = await sha256(locationData);

  const deviceData = `${contribution.device_fingerprint || 'unknown'}|${contribution.carrier || 'unknown'}|${contribution.device_type || 'unknown'}`;
  const deviceHash = await sha256(deviceData);

  const networkData = `${contribution.signal_dbm || 0}|${contribution.network_type || 'unknown'}|${contribution.accuracy_meters || 0}`;
  const networkHash = await sha256(networkData);

  const proofData = `v${proofVersion}|${userId}|${locationHash}|${deviceHash}|${networkHash}|${timestamp}|${serverSecret}`;
  const proofHash = await sha256(proofData);

  return {
    proof_hash: proofHash,
    proof_version: proofVersion,
    timestamp,
    location_hash: locationHash.substring(0, 16),
    device_hash: deviceHash.substring(0, 16),
    network_hash: networkHash.substring(0, 16)
  };
}

interface SyncRequest {
  contributions: ContributionData[];
  signalLogs?: SignalLogData[];
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  suspicionScore: number;
}

// Validation constants
const MAX_ACCURACY_METERS = 100;
const MAX_SPEED_MPS = 150;
const MIN_TIME_BETWEEN_POINTS_MS = 500;
const MAX_DISTANCE_PER_SECOND_METERS = 200;
const DUPLICATE_THRESHOLD_METERS = 0.5;
const SUSPICIOUS_PATTERN_THRESHOLD = 5;

// Speed test sanity bounds
const MIN_SPEED_MBPS = 0.01;
const MAX_SPEED_MBPS = 10000;
const MIN_LATENCY_MS = 1;
const MAX_LATENCY_MS = 30000;

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
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

  if (contribution.accuracy_meters && contribution.accuracy_meters > MAX_ACCURACY_METERS) {
    suspicionScore += 2;
    reasons.push(`Low GPS accuracy: ${contribution.accuracy_meters}m`);
  }

  if (Math.abs(contribution.latitude) > 90 || Math.abs(contribution.longitude) > 180) {
    return { valid: false, reason: 'Invalid coordinates', suspicionScore: 10 };
  }

  if (contribution.latitude === 0 && contribution.longitude === 0) {
    return { valid: false, reason: 'Null island coordinates detected', suspicionScore: 10 };
  }

  if (contribution.speed_mps && contribution.speed_mps > MAX_SPEED_MPS) {
    suspicionScore += 3;
    reasons.push(`Impossible speed: ${contribution.speed_mps} m/s`);
  }

  if (previousContribution) {
    const timeDiffMs = new Date(contribution.recorded_at).getTime() - 
                       new Date(previousContribution.recorded_at).getTime();
    
    if (timeDiffMs < MIN_TIME_BETWEEN_POINTS_MS && timeDiffMs >= 0) {
      suspicionScore += 1;
      reasons.push('Points recorded too quickly');
    }

    if (timeDiffMs < 0) {
      suspicionScore += 3;
      reasons.push('Time inconsistency detected');
    }

    const distance = calculateDistance(
      previousContribution.latitude, previousContribution.longitude,
      contribution.latitude, contribution.longitude
    );

    if (distance < DUPLICATE_THRESHOLD_METERS) {
      suspicionScore += 0.5;
      reasons.push('Duplicate location');
    }

    if (timeDiffMs > 0) {
      const calculatedSpeedMps = (distance / timeDiffMs) * 1000;
      
      if (calculatedSpeedMps > MAX_DISTANCE_PER_SECOND_METERS) {
        suspicionScore += 4;
        reasons.push(`Impossible travel speed: ${calculatedSpeedMps.toFixed(1)} m/s`);
      }

      if (contribution.speed_mps) {
        const speedDiff = Math.abs(contribution.speed_mps - calculatedSpeedMps);
        if (speedDiff > 50 && calculatedSpeedMps > 10) {
          suspicionScore += 2;
          reasons.push('Speed mismatch between reported and calculated');
        }
      }
    }
  }

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

// Validate signal log data with speed/latency sanity checks
interface SignalLogValidation {
  valid: boolean;
  sanitized: SignalLogData;
  flags: string[];
}

function validateSignalLog(log: SignalLogData): SignalLogValidation {
  const flags: string[] = [];
  const sanitized = { ...log };

  // Coordinate validation
  if (Math.abs(log.latitude) > 90 || Math.abs(log.longitude) > 180) {
    return { valid: false, sanitized, flags: ['Invalid coordinates'] };
  }
  if (log.latitude === 0 && log.longitude === 0) {
    return { valid: false, sanitized, flags: ['Null island'] };
  }

  // Round coordinates
  sanitized.latitude = roundCoord(log.latitude, 4);
  sanitized.longitude = roundCoord(log.longitude, 4);

  // Speed test sanity
  if (log.speed_test_down !== undefined && log.speed_test_down !== null) {
    if (log.speed_test_down < MIN_SPEED_MBPS || log.speed_test_down > MAX_SPEED_MBPS) {
      sanitized.speed_test_down = undefined;
      flags.push(`download_out_of_range:${log.speed_test_down}`);
    }
  }
  if (log.speed_test_up !== undefined && log.speed_test_up !== null) {
    if (log.speed_test_up < MIN_SPEED_MBPS || log.speed_test_up > MAX_SPEED_MBPS) {
      sanitized.speed_test_up = undefined;
      flags.push(`upload_out_of_range:${log.speed_test_up}`);
    }
  }

  // Latency sanity
  if (log.latency_ms !== undefined && log.latency_ms !== null) {
    if (log.latency_ms < MIN_LATENCY_MS || log.latency_ms > MAX_LATENCY_MS) {
      sanitized.latency_ms = undefined;
      flags.push(`latency_out_of_range:${log.latency_ms}`);
    }
  }

  // RSRP sanity (-140 to -44 dBm typical)
  if (log.rsrp !== undefined && log.rsrp !== null) {
    if (log.rsrp < -150 || log.rsrp > -30) {
      flags.push(`rsrp_suspicious:${log.rsrp}`);
    }
  }

  // Accuracy check
  if (log.accuracy_meters && log.accuracy_meters > MAX_ACCURACY_METERS) {
    flags.push(`low_gps_accuracy:${log.accuracy_meters}`);
  }

  // Movement speed sanity
  if (log.speed_mps !== undefined && log.speed_mps !== null) {
    if (log.speed_mps < 0 || log.speed_mps > MAX_SPEED_MPS) {
      sanitized.speed_mps = undefined;
      flags.push(`movement_speed_invalid:${log.speed_mps}`);
    }
  }

  return { valid: true, sanitized, flags };
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

    const { contributions, signalLogs }: SyncRequest = await req.json();

    // Process signal logs if provided
    let signalLogsResult = { inserted: 0, rejected: 0, flags: [] as string[] };
    
    if (signalLogs && Array.isArray(signalLogs) && signalLogs.length > 0) {
      console.log(`Processing ${signalLogs.length} signal logs for user ${user.id}`);
      
      const validSignalLogs: Record<string, unknown>[] = [];
      const allFlags: string[] = [];
      
      for (const log of signalLogs) {
        const validation = validateSignalLog(log);
        
        if (!validation.valid) {
          signalLogsResult.rejected++;
          allFlags.push(...validation.flags);
          console.log(`Rejected signal log: ${validation.flags.join(', ')}`);
          continue;
        }
        
        if (validation.flags.length > 0) {
          allFlags.push(...validation.flags);
        }
        
        const s = validation.sanitized;
        
        // Derive additional fields
        const geohash = encodeGeohash(s.latitude, s.longitude, 7);
        const countryCode = deriveCountryFromMCC(s.mcc);
        const networkGeneration = deriveNetworkGeneration(s.network_type);
        
        validSignalLogs.push({
          user_id: user.id,
          session_id: s.session_id || null,
          latitude: s.latitude,
          longitude: s.longitude,
          accuracy_meters: s.accuracy_meters,
          altitude_meters: s.altitude_meters,
          speed_mps: s.speed_mps,
          heading_degrees: s.heading_degrees,
          rsrp: s.rsrp,
          rsrq: s.rsrq,
          rssi: s.rssi,
          sinr: s.sinr,
          roaming_status: s.roaming_status,
          speed_test_down: s.speed_test_down,
          speed_test_up: s.speed_test_up,
          latency_ms: s.latency_ms,
          jitter_ms: s.jitter_ms,
          pci: s.pci,
          band_number: s.band_number,
          frequency_mhz: s.frequency_mhz,
          bandwidth_mhz: s.bandwidth_mhz,
          recorded_at: s.recorded_at,
          data_quality_score: s.data_quality_score,
          is_indoor: s.is_indoor,
          is_rare_location: s.is_rare_location,
          speed_test_error: s.speed_test_error,
          speed_test_provider: s.speed_test_provider,
          latency_error: s.latency_error,
          latency_provider: s.latency_provider,
          latency_method: s.latency_method,
          network_type: s.network_type,
          carrier_name: s.carrier_name,
          mcc: s.mcc,
          mnc: s.mnc,
          mcc_mnc: s.mcc_mnc,
          device_model: s.device_model,
          device_manufacturer: s.device_manufacturer,
          os_version: s.os_version,
          cell_id: s.cell_id,
          tac: s.tac,
          // Derived fields (stored in existing columns or logged)
          // geohash and country_code would need new columns - log for now
        });
        
        console.log(`Signal log prepared: geohash=${geohash}, country=${countryCode || 'unknown'}, gen=${networkGeneration || 'unknown'}`);
      }
      
      if (validSignalLogs.length > 0) {
        const { error: signalInsertError } = await supabase
          .from('signal_logs')
          .insert(validSignalLogs);
        
        if (signalInsertError) {
          console.error('Signal logs insert error:', signalInsertError);
          signalLogsResult.rejected += validSignalLogs.length;
        } else {
          signalLogsResult.inserted = validSignalLogs.length;
          console.log(`Inserted ${validSignalLogs.length} signal logs`);
        }
      }
      
      signalLogsResult.flags = [...new Set(allFlags)].slice(0, 10);
    }

    // Handle contributions if provided (existing logic)
    if (!contributions || !Array.isArray(contributions) || contributions.length === 0) {
      // If only signal logs were provided, return success
      if (signalLogs && signalLogs.length > 0) {
        return new Response(
          JSON.stringify({
            success: true,
            synced_count: 0,
            rejected_count: 0,
            points_earned: 0,
            signal_logs: signalLogsResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'No contributions to sync' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${contributions.length} contributions for user ${user.id}`);

    const { data: recentContributions } = await supabase
      .from('offline_contribution_queue')
      .select('latitude, longitude, recorded_at, speed_mps, accuracy_meters')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(10);

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
          reasons: [...new Set(rejectionReasons)].slice(0, 5),
          signal_logs: signalLogsResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validated: ${validCount} valid, ${rejectedCount} rejected`);

    const serverSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.substring(0, 32) || 'default-secret';
    const proofs: LocationProof[] = [];
    
    for (const contribution of validContributions) {
      const proof = await generateLocationProof(user.id, contribution, serverSecret);
      proofs.push(proof);
    }

    console.log(`Generated ${proofs.length} location proofs for user ${user.id}`);

    const totalPointsEarned = Math.floor(validContributions.length * 5);

    const queueItems = validContributions.map((c, index) => ({
      user_id: user.id,
      session_id: c.session_id || null,
      latitude: roundCoord(c.latitude, 4),
      longitude: roundCoord(c.longitude, 4),
      signal_dbm: c.signal_dbm,
      network_type: c.network_type,
      carrier: c.carrier,
      device_type: c.device_type,
      speed_mps: c.speed_mps,
      accuracy_meters: c.accuracy_meters,
      recorded_at: c.recorded_at,
      synced_at: new Date().toISOString(),
      processed: true,
      proof_hash: proofs[index].proof_hash,
      proof_version: proofs[index].proof_version,
      proof_timestamp: proofs[index].timestamp,
      location_hash: proofs[index].location_hash,
      device_hash: proofs[index].device_hash,
      network_hash: proofs[index].network_hash,
      device_fingerprint: c.device_fingerprint || null
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
      latitude: roundCoord(c.latitude, 4),
      longitude: roundCoord(c.longitude, 4),
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
        proofs_generated: proofs.length,
        validation_summary: {
          avg_suspicion_score: avgSuspicionScore.toFixed(2),
          rejection_reasons: [...new Set(rejectionReasons)].slice(0, 3)
        },
        location_proofs: proofs.map(p => ({
          hash: p.proof_hash.substring(0, 12) + '...',
          version: p.proof_version,
          timestamp: p.timestamp
        })),
        signal_logs: signalLogsResult
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
