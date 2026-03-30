import { useCallback, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  TelephonyInfoPlugin, 
  isTelephonyPluginAvailable
} from '@/plugins/TelephonyInfoPlugin';
import { calculateDataQualityScore } from '@/utils/dataQualityScoring';
import { runSpeedTest, type SpeedTestResult as ProviderSpeedTestResult, type SpeedTestProgressCallback } from '@/utils/speedTestProviders';
import { getIOSDeviceName } from '@/utils/iosDeviceModels';

// Type-only imports
type Position = import('@capacitor/geolocation').Position;
type DeviceModule = typeof import('@capacitor/device');

/**
 * Telco-Grade Signal Metrics
 * These are the "money metrics" that network engineers and telcos pay for
 */
export interface TelcoMetrics {
  // Signal Quality (The "Money" Metrics)
  rsrp?: number; // Reference Signal Received Power (dBm, e.g., -90)
  rsrq?: number; // Reference Signal Received Quality (dB)
  rssi?: number; // Received Signal Strength Indicator (dBm)
  sinr?: number; // Signal-to-Interference-plus-Noise Ratio (dB)
  
  // Network Identity
  networkType?: string; // '5G SA', '5G NSA', 'LTE', 'LTE-A', 'HSPA+', '3G', '2G'
  carrierName?: string; // Display name (e.g., 'Verizon')
  mcc?: string; // Mobile Country Code (e.g., '310')
  mnc?: string; // Mobile Network Code (e.g., '410')
  mccMnc?: string; // Combined (e.g., '310-410')
  roamingStatus?: boolean;
  
  // Connection Quality
  speedTestDown?: number; // Mbps
  speedTestUp?: number; // Mbps
  latencyMs?: number; // Ping (ms)
  jitterMs?: number; // Jitter (ms)
  
  // Error tracking for speed tests
  speedTestError?: string;
  speedTestProvider?: string;
  latencyError?: string;
  latencyProvider?: string;
  latencyMethod?: string;
  
  // Device Context
  deviceModel?: string; // 'iPhone 15 Pro', 'Pixel 8'
  deviceManufacturer?: string; // 'Apple', 'Samsung'
  osVersion?: string; // 'iOS 17.2', 'Android 14'
  
  // Cell Tower Info
  cellId?: string;
  tac?: string; // Tracking Area Code
  pci?: number; // Physical Cell ID
  bandNumber?: number; // e.g., Band 71
  frequencyMhz?: number;
  bandwidthMhz?: number;
}

/**
 * Full Signal Log Entry (for database)
 */
export interface SignalLogEntry extends TelcoMetrics {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number;
  speedMps?: number;
  headingDegrees?: number;
  recordedAt: string;
  sessionId?: string;
  dataQualityScore?: number; // 0-100 quality score
  isMockLocation?: boolean; // Anti-cheat flag
  // Device capability (B2B value)
  device5gCapable?: boolean;
  maxSupportedGeneration?: string; // '5G', '4G', '3G', '2G'
}

// Minimum distance between logs (meters)
const MIN_DISTANCE_THRESHOLD = 75;
// Maximum time between logs when stationary (ms)
const MAX_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes
// Maximum samples per hour (smart sampling cap for battery)
const MAX_SAMPLES_PER_HOUR = 12; // ~1 every 5 minutes max
// Signal change threshold (dBm) to trigger a log
const SIGNAL_CHANGE_THRESHOLD = 5;
// Batch size before flushing to server
const BATCH_SIZE = 20;

/**
 * Hook for collecting telco-grade signal metrics
 * 
 * PLATFORM NOTES:
 * - Android: Full access to RSRP, RSRQ, SINR, Cell ID via TelephonyManager
 * - iOS: Limited to Carrier name, Radio Technology, and derived metrics
 */
export const useTelcoMetrics = () => {
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';
  const isAndroid = Capacitor.getPlatform() === 'android';
  const [deviceInfo, setDeviceInfo] = useState<{
    model: string;
    manufacturer: string;
    osVersion: string;
  } | null>(null);
  
  const lastLogPosition = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const hourlyLogCount = useRef<{ hour: number; count: number }>({ hour: 0, count: 0 });
  const lastNetworkType = useRef<string | null>(null);
  const lastSignalRsrp = useRef<number | null>(null);
  const signalLogBatch = useRef<SignalLogEntry[]>([]);
  const speedTestCache = useRef<{ 
    down?: number; 
    up?: number; 
    latency?: number; 
    provider?: string;
    latencyMethod?: string;
    downloadError?: string;
    uploadError?: string;
    latencyError?: string;
    timestamp: number;
  } | null>(null);
  const deviceModuleRef = useRef<DeviceModule | null>(null);
  // Ref for native device info - always fresh from native APIs
  const nativeDeviceInfoRef = useRef<{
    model: string;
    manufacturer: string;
    osVersion: string;
    platform: string;
    is5gCapable?: boolean;
    maxSupportedGeneration?: string;
  } | null>(null);
  
  /**
   * Initialize device info from NATIVE platform APIs (not Capacitor Device plugin)
   * This ensures we always get accurate values:
   * - Android: Build.MANUFACTURER + Build.MODEL
   * - iOS: Raw model identifier (e.g., "iPhone17,2")
   * 
   * Called on every app launch to ensure fresh values
   */
  const initDeviceInfo = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      const info = {
        model: 'Web Browser',
        manufacturer: 'Unknown',
        osVersion: 'Web'
      };
      setDeviceInfo(info);
      nativeDeviceInfoRef.current = { ...info, platform: 'web' };
      return;
    }
    
    try {
      // Use our native plugins for accurate device info
      if (isAndroid) {
        // Android: Use TelephonyInfoPlugin.getDeviceInfo()
        const info = await TelephonyInfoPlugin.getDeviceInfo();
        const deviceData = {
          model: info.model || 'Unknown',
          manufacturer: info.manufacturer || 'Unknown',
          osVersion: `Android ${info.osVersion || 'Unknown'}`
        };
        setDeviceInfo(deviceData);
        nativeDeviceInfoRef.current = { 
          ...deviceData, 
          platform: 'android',
          is5gCapable: info.is5gCapable ?? undefined,
          maxSupportedGeneration: info.maxSupportedGeneration ?? undefined,
        };
        console.log('[TelcoMetrics] Android device info from native:', JSON.stringify(info));
      } else if (isIOS) {
        // iOS: Use BackgroundLocation.getDeviceInfo()
        // This method works independently of location permission
        const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
        const info = await BackgroundLocation.getDeviceInfo();
        
        // Raw model identifier (e.g., "iPhone17,2")
        const rawModel = info.model || info.modelIdentifier || 'Unknown';
        // Map to marketing name (e.g., "iPhone 16 Pro")
        const marketingName = getIOSDeviceName(rawModel);
        
        const deviceData = {
          // Use marketing name for user-friendly display, store raw for accuracy
          model: marketingName,
          manufacturer: 'Apple',
          osVersion: `iOS ${info.osVersion || 'Unknown'}`
        };
        setDeviceInfo(deviceData);
        nativeDeviceInfoRef.current = { 
          ...deviceData, 
          platform: 'ios',
          // Also store raw identifier for B2B data accuracy
        };
        console.log('[TelcoMetrics] iOS device info from native:', {
          rawIdentifier: rawModel,
          marketingName,
          osVersion: info.osVersion
        });
      }
    } catch (error) {
      console.error('Failed to get native device info:', error);
      // Fallback to Capacitor Device plugin (less reliable)
      try {
        if (!deviceModuleRef.current) {
          deviceModuleRef.current = await import('@capacitor/device');
        }
        const { Device } = deviceModuleRef.current;
        const info = await Device.getInfo();
        const deviceData = {
          model: info.model || 'Unknown',
          manufacturer: info.manufacturer || 'Unknown',
          osVersion: `${info.platform} ${info.osVersion}`
        };
        setDeviceInfo(deviceData);
        nativeDeviceInfoRef.current = { ...deviceData, platform: info.platform };
        console.warn('[TelcoMetrics] Using Capacitor fallback for device info');
      } catch (fallbackError) {
        console.error('Fallback device info also failed:', fallbackError);
      }
    }
  }, [isAndroid, isIOS]);

  /**
   * Check if we should log based on distance/time thresholds AND hourly cap
   * Rule: Log every 100m OR every 5 minutes if stationary, MAX 12 per hour
   */
  const shouldLogDataPoint = useCallback((position: Position): boolean => {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    
    // Reset hourly counter if new hour
    if (hourlyLogCount.current.hour !== currentHour) {
      hourlyLogCount.current = { hour: currentHour, count: 0 };
    }
    
    // Check hourly cap
    if (hourlyLogCount.current.count >= MAX_SAMPLES_PER_HOUR) {
      console.log('[TelcoMetrics] Hourly sample cap reached, skipping');
      return false;
    }
    
    const currentPos = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      time: now
    };
    
    if (!lastLogPosition.current) {
      lastLogPosition.current = currentPos;
      hourlyLogCount.current.count++;
      return true;
    }
    
    // Calculate distance from last log
    const distance = calculateDistanceMeters(
      lastLogPosition.current.lat,
      lastLogPosition.current.lon,
      currentPos.lat,
      currentPos.lon
    );
    
    // Time since last log
    const timeSinceLastLog = now - lastLogPosition.current.time;
    
    // Log if moved 100m+ OR if 5 minutes have passed
    if (distance >= MIN_DISTANCE_THRESHOLD || timeSinceLastLog >= MAX_TIME_THRESHOLD) {
      lastLogPosition.current = currentPos;
      hourlyLogCount.current.count++;
      return true;
    }
    
    return false;
  }, []);

  /**
   * Force a log on network change (valuable handoff data)
   * Call this when connection type changes
   */
  const shouldLogOnNetworkChange = useCallback((currentNetworkType: string): boolean => {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    
    // Reset hourly counter if new hour
    if (hourlyLogCount.current.hour !== currentHour) {
      hourlyLogCount.current = { hour: currentHour, count: 0 };
    }
    
    // Always allow network change logs (valuable handoff data)
    if (lastNetworkType.current !== null && lastNetworkType.current !== currentNetworkType) {
      console.log(`[TelcoMetrics] Network change detected: ${lastNetworkType.current} → ${currentNetworkType}`);
      lastNetworkType.current = currentNetworkType;
      
      // Count against cap but don't block
      if (hourlyLogCount.current.count < MAX_SAMPLES_PER_HOUR) {
        hourlyLogCount.current.count++;
      }
      
      return true;
    }
    
    lastNetworkType.current = currentNetworkType;
    return false;
  }, []);

  /**
   * Check if signal strength changed by ≥5 dBm (valuable for coverage quality mapping)
   */
  const shouldLogOnSignalChange = useCallback((currentRsrp: number | undefined): boolean => {
    if (currentRsrp == null) return false;
    
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    
    if (hourlyLogCount.current.hour !== currentHour) {
      hourlyLogCount.current = { hour: currentHour, count: 0 };
    }
    
    if (lastSignalRsrp.current === null) {
      lastSignalRsrp.current = currentRsrp;
      return false; // First reading — just record baseline
    }
    
    const delta = Math.abs(currentRsrp - lastSignalRsrp.current);
    if (delta >= SIGNAL_CHANGE_THRESHOLD) {
      console.log(`[TelcoMetrics] Signal change detected: ${lastSignalRsrp.current} → ${currentRsrp} (Δ${delta} dBm)`);
      lastSignalRsrp.current = currentRsrp;
      
      if (hourlyLogCount.current.count < MAX_SAMPLES_PER_HOUR) {
        hourlyLogCount.current.count++;
      }
      return true;
    }
    
    return false;
  }, []);

  /**
   * Add a signal log entry to the batch buffer.
   * Returns the batch when it reaches BATCH_SIZE, otherwise null.
   */
  const addToBatch = useCallback((entry: SignalLogEntry): SignalLogEntry[] | null => {
    signalLogBatch.current.push(entry);
    console.log(`[TelcoMetrics] Batch: ${signalLogBatch.current.length}/${BATCH_SIZE}`);
    
    if (signalLogBatch.current.length >= BATCH_SIZE) {
      const batch = [...signalLogBatch.current];
      signalLogBatch.current = [];
      return batch;
    }
    return null;
  }, []);

  /**
   * Flush whatever is in the batch (e.g. on session stop or app background)
   */
  const flushBatch = useCallback((): SignalLogEntry[] => {
    const batch = [...signalLogBatch.current];
    signalLogBatch.current = [];
    return batch;
  }, []);

  /**
   * Get current batch size (for UI display or debugging)
   */
  const getBatchSize = useCallback((): number => {
    return signalLogBatch.current.length;
  }, []);

  /**
   * Get current telco metrics
   * Platform-specific implementation with native plugin support
   */
  const getTelcoMetrics = useCallback(async (connectionType: string): Promise<TelcoMetrics> => {
    const metrics: TelcoMetrics = {
      deviceModel: deviceInfo?.model,
      deviceManufacturer: deviceInfo?.manufacturer,
      osVersion: deviceInfo?.osVersion,
    };
    
    // Map connection type to granular network type
    metrics.networkType = mapConnectionToNetworkType(connectionType);
    
    if (!Capacitor.isNativePlatform()) {
      // Web: Limited data available
      metrics.carrierName = 'Unknown (Web)';
      return metrics;
    }
    
    if (isAndroid && isTelephonyPluginAvailable()) {
      // Android with native plugin: Full telco-grade data
      try {
        const signalInfo = await TelephonyInfoPlugin.getSignalInfo();
        
        // Apply native metrics
        if (signalInfo.rsrp) metrics.rsrp = signalInfo.rsrp;
        if (signalInfo.rsrq) metrics.rsrq = signalInfo.rsrq;
        if (signalInfo.rssi) metrics.rssi = signalInfo.rssi;
        if (signalInfo.sinr) metrics.sinr = signalInfo.sinr;
        if (signalInfo.cellId) metrics.cellId = signalInfo.cellId;
        if (signalInfo.tac) metrics.tac = signalInfo.tac;
        if (signalInfo.pci) metrics.pci = signalInfo.pci;
        if (signalInfo.mcc) metrics.mcc = signalInfo.mcc;
        if (signalInfo.mnc) metrics.mnc = signalInfo.mnc;
        if (signalInfo.mccMnc) metrics.mccMnc = signalInfo.mccMnc;
        if (signalInfo.carrierName) metrics.carrierName = signalInfo.carrierName;
        if (signalInfo.networkType) metrics.networkType = signalInfo.networkType;
        if (signalInfo.isRoaming !== undefined) metrics.roamingStatus = signalInfo.isRoaming;
        if (signalInfo.bandNumber) metrics.bandNumber = signalInfo.bandNumber;
        if (signalInfo.frequencyMhz) metrics.frequencyMhz = signalInfo.frequencyMhz;
        if (signalInfo.bandwidthMhz) metrics.bandwidthMhz = signalInfo.bandwidthMhz;
        
        console.log('[TelcoMetrics] Native Android signal data acquired:', {
          rsrp: metrics.rsrp,
          networkType: metrics.networkType,
          cellId: metrics.cellId
        });
      } catch (error) {
        console.warn('[TelcoMetrics] Native plugin error, using fallback:', error);
        await getAndroidSignalMetrics(metrics);
      }
    } else if (isAndroid) {
      // Android without native plugin: Use Connection API fallback
      await getAndroidSignalMetrics(metrics);
    } else if (isIOS) {
      // iOS: Limited by Apple's privacy restrictions
      await getIOSSignalMetrics(metrics);
    }
    
    // Add speed test data if cached and recent (< 10 minutes)
    if (speedTestCache.current && Date.now() - speedTestCache.current.timestamp < 10 * 60 * 1000) {
      metrics.speedTestDown = speedTestCache.current.down;
      metrics.speedTestUp = speedTestCache.current.up;
      metrics.latencyMs = speedTestCache.current.latency;
      metrics.speedTestProvider = speedTestCache.current.provider;
      metrics.latencyProvider = speedTestCache.current.provider;
      metrics.latencyMethod = speedTestCache.current.latencyMethod;
      metrics.speedTestError = speedTestCache.current.downloadError;
      metrics.latencyError = speedTestCache.current.latencyError;
    }
    
    return metrics;
  }, [deviceInfo, isAndroid, isIOS]);

  /**
   * Run a reliable speed test with fallback providers
   * Uses Nomiqa endpoints first, falls back to Cloudflare
   * Stores errors in DB for debugging
   * Now selects appropriate file size based on network type
   */
  const runLightweightSpeedTest = useCallback(async (
    networkType?: string,
    onProgress?: SpeedTestProgressCallback
  ): Promise<{
    down: number | null;
    up: number | null;
    latency: number | null;
    provider: string;
    latencyMethod: string;
    downloadError?: string;
    uploadError?: string;
    latencyError?: string;
  } | null> => {
    try {
      // Use the new provider-based speed test with fallback
      // Pass networkType for adaptive file size selection
      const result = await runSpeedTest(true, networkType, onProgress);
      
      // Cache the result
      speedTestCache.current = { 
        down: result.down ?? undefined,
        up: result.up ?? undefined,
        latency: result.latency ?? undefined,
        provider: result.provider,
        latencyMethod: result.latencyMethod,
        downloadError: result.downloadError,
        uploadError: result.uploadError,
        latencyError: result.latencyError,
        timestamp: Date.now() 
      };
      
      return {
        down: result.down,
        up: result.up,
        latency: result.latency,
        provider: result.provider,
        latencyMethod: result.latencyMethod,
        downloadError: result.downloadError,
        uploadError: result.uploadError,
        latencyError: result.latencyError
      };
    } catch (error) {
      console.error('Speed test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Cache the failure for DB storage
      speedTestCache.current = {
        timestamp: Date.now(),
        provider: 'none',
        latencyMethod: 'none',
        downloadError: errorMessage,
        latencyError: errorMessage
      };
      
      return {
        down: null,
        up: null,
        latency: null,
        provider: 'none',
        latencyMethod: 'none',
        downloadError: errorMessage,
        latencyError: errorMessage
      };
    }
  }, []);

  /**
   * Create a full signal log entry with quality score
   */
  const createSignalLogEntry = useCallback(async (
    position: Position,
    connectionType: string,
    sessionId?: string
  ): Promise<SignalLogEntry> => {
    const telcoMetrics = await getTelcoMetrics(connectionType);
    
    // Check for mock location on Android
    let isMockLocation = false;
    if (isAndroid && isTelephonyPluginAvailable()) {
      try {
        const mockCheck = await TelephonyInfoPlugin.isMockLocationEnabled();
        isMockLocation = mockCheck.isMock;
      } catch {
        // Ignore error, assume not mocked
      }
    }
    
    const entry: SignalLogEntry = {
      ...telcoMetrics,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyMeters: position.coords.accuracy || undefined,
      altitudeMeters: position.coords.altitude || undefined,
      speedMps: position.coords.speed || undefined,
      headingDegrees: position.coords.heading || undefined,
      recordedAt: new Date().toISOString(),
      sessionId,
      isMockLocation,
      // Device capability (from native init, NULL on iOS — computed server-side later)
      device5gCapable: nativeDeviceInfoRef.current?.is5gCapable ?? undefined,
      maxSupportedGeneration: nativeDeviceInfoRef.current?.maxSupportedGeneration ?? undefined,
    };
    
    // Calculate data quality score
    const qualityResult = calculateDataQualityScore({
      network_type: entry.networkType,
      accuracy_meters: entry.accuracyMeters,
      rsrp: entry.rsrp,
      rsrq: entry.rsrq,
      sinr: entry.sinr,
      rssi: entry.rssi,
      cell_id: entry.cellId,
      mcc: entry.mcc,
      mnc: entry.mnc,
      carrier_name: entry.carrierName,
      speed_test_down: entry.speedTestDown,
      speed_test_up: entry.speedTestUp,
      latency_ms: entry.latencyMs,
      band_number: entry.bandNumber,
      frequency_mhz: entry.frequencyMhz,
      latitude: entry.latitude,
      longitude: entry.longitude,
      is_indoor: entry.accuracyMeters ? entry.accuracyMeters > 30 : false
    });
    
    entry.dataQualityScore = qualityResult.totalScore;
    
    console.log('[TelcoMetrics] Signal log created with quality score:', qualityResult.totalScore);
    
    return entry;
  }, [getTelcoMetrics, isAndroid]);

  /**
   * Reset logging position and counters (call when starting new session)
   */
  const resetLoggingState = useCallback(() => {
    lastLogPosition.current = null;
    speedTestCache.current = null;
    hourlyLogCount.current = { hour: 0, count: 0 };
    lastNetworkType.current = null;
    lastSignalRsrp.current = null;
    signalLogBatch.current = [];
  }, []);

  return {
    initDeviceInfo,
    shouldLogDataPoint,
    shouldLogOnNetworkChange,
    shouldLogOnSignalChange,
    getTelcoMetrics,
    runLightweightSpeedTest,
    createSignalLogEntry,
    addToBatch,
    flushBatch,
    getBatchSize,
    resetLoggingState,
    deviceInfo,
    getHourlySampleCount: () => hourlyLogCount.current.count
  };
};

// ============= Helper Functions =============

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Map generic connection type to granular network type
 */
function mapConnectionToNetworkType(connectionType: string): string {
  const typeMap: Record<string, string> = {
    '5g': '5G SA',
    '4g': 'LTE',
    'lte': 'LTE',
    'cellular': 'LTE', // Default cellular to LTE
    '3g': '3G',
    '2g': '2G',
    'wifi': 'WiFi',
    'none': 'None',
    'unknown': 'Unknown'
  };
  
  return typeMap[connectionType.toLowerCase()] || connectionType.toUpperCase();
}

/**
 * Android-specific signal metrics collection
 * Note: Full implementation requires native Android plugin access to TelephonyManager
 */
async function getAndroidSignalMetrics(metrics: TelcoMetrics): Promise<void> {
  // In a full implementation, this would call a native plugin like:
  // const signalInfo = await TelephonyPlugin.getSignalStrength();
  // metrics.rsrp = signalInfo.rsrp;
  // metrics.rsrq = signalInfo.rsrq;
  // metrics.sinr = signalInfo.sinr;
  // metrics.cellId = signalInfo.cellId;
  // metrics.mcc = signalInfo.mcc;
  // metrics.mnc = signalInfo.mnc;
  
  // For now, use available Connection API data
  // @ts-ignore - Navigator connection API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    // Effective type gives us network generation
    if (connection.effectiveType) {
      const typeMap: Record<string, string> = {
        'slow-2g': '2G',
        '2g': '2G',
        '3g': '3G',
        '4g': 'LTE'
      };
      metrics.networkType = typeMap[connection.effectiveType] || metrics.networkType;
    }
    
    // Downlink speed estimate (Mbps)
    if (connection.downlink) {
      metrics.speedTestDown = connection.downlink;
    }
    
    // Round-trip time estimate (ms)
    if (connection.rtt) {
      metrics.latencyMs = connection.rtt;
    }
  }
  
  // Placeholder carrier detection
  metrics.carrierName = 'Android Carrier';
}

/**
 * iOS-specific signal metrics collection
 * Apple restricts direct access to RSRP/RSRQ
 * We can get: Carrier name, Radio Technology
 */
async function getIOSSignalMetrics(metrics: TelcoMetrics): Promise<void> {
  // iOS restrictions mean we can only get:
  // 1. Carrier name (via CTCarrier - deprecated in iOS 16+)
  // 2. Radio Access Technology (via CTTelephonyNetworkInfo)
  
  // For privacy, iOS doesn't expose signal strength or cell tower info
  // We rely on the network type from the Network plugin
  
  metrics.carrierName = 'iOS Carrier';
  
  // On iOS, we can estimate signal quality from download performance
  // This is done through the speed test function
}
