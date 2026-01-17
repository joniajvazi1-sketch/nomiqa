import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useBackgroundGeolocation } from './useBackgroundGeolocation';
import { useNetworkStatus } from './useNetworkStatus';
import { useHaptics } from './useHaptics';
import { useTelcoMetrics, SignalLogEntry } from './useTelcoMetrics';
import { type SpeedTestProgressCallback } from '@/utils/speedTestProviders';
import { useContributionPersistence } from './useContributionPersistence';
import { checkDeviceIntegrity, DeviceIntegrityResult } from '@/utils/deviceIntegrity';

// Type-only import
type GeolocationModule = typeof import('@capacitor/geolocation');
type Position = import('@capacitor/geolocation').Position;

interface SpeedTestResult {
  down: number;
  up: number;
  latency: number;
  timestamp: Date;
}

interface ContributionStats {
  pointsEarned: number;
  distanceMeters: number;
  speedKmh: number;
  dataPointsCount: number;
  signalLogsCount: number; // Telco-grade logs
  duration: number;
  timePoints: number;
  distancePoints: number;
  speedTestPoints: number; // Bonus points from speed tests
  speedTestCount: number; // Number of speed tests completed
  lastSpeedTest: SpeedTestResult | null;
}

interface ContributionSession {
  id: string | null;
  startedAt: Date | null;
  status: 'idle' | 'active' | 'paused' | 'completed';
}

interface OfflineQueueItem {
  type: 'basic' | 'telco';
  latitude: number;
  longitude: number;
  signal_dbm?: number;
  network_type?: string;
  carrier?: string;
  device_type?: string;
  speed_mps?: number;
  accuracy_meters?: number;
  recorded_at: string;
  session_id?: string;
  // Telco-grade fields
  telcoMetrics?: SignalLogEntry;
  // Device integrity for anti-fraud
  deviceIntegrity?: DeviceIntegrityResult;
}

const OFFLINE_QUEUE_KEY = 'nomiqa_offline_contribution_queue';
const SPEED_TEST_INTERVAL = 10 * 60 * 1000; // Run speed test every 10 minutes
const SPEED_TEST_BONUS_POINTS = 2; // Bonus points per speed test
const PREMIUM_SPEED_THRESHOLD = 50; // Mbps - extra bonus for fast connections
const DAILY_SPEED_TEST_LIMIT = 10; // Server enforces this - matches MAX_SPEED_TESTS_PER_DAY in edge function
const SPEED_TEST_DAILY_KEY = 'nomiqa_speed_tests_today';
const MAX_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours max session before auto-expiry
const MAX_OFFLINE_QUEUE_SIZE = 1000; // FIFO cap to prevent localStorage overflow

/**
 * Check if connection type is cellular (earns points)
 */
const isCellularConnection = (type: string): boolean => {
  const cellularTypes = ['cellular', '4g', '5g', 'lte', '3g', '2g'];
  return cellularTypes.includes(type.toLowerCase());
};

/**
 * Get today's speed test count from localStorage
 */
const getSpeedTestsToday = (): number => {
  try {
    const stored = localStorage.getItem(SPEED_TEST_DAILY_KEY);
    if (!stored) return 0;
    const { count, date } = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) return 0; // Reset count on new day
    return count || 0;
  } catch {
    return 0;
  }
};

/**
 * Increment today's speed test count
 */
const incrementSpeedTestCount = (): void => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = getSpeedTestsToday();
    localStorage.setItem(SPEED_TEST_DAILY_KEY, JSON.stringify({
      count: currentCount + 1,
      date: today
    }));
  } catch (error) {
    console.error('Failed to save speed test count:', error);
  }
};

/**
 * Check if session is stale (exceeded max duration)
 */
const isSessionStale = (startedAt: number | null): boolean => {
  if (!startedAt) return false;
  return Date.now() - startedAt > MAX_SESSION_DURATION_MS;
};

/**
 * Request location permission explicitly (user-initiated only)
 * Apple requires this to be triggered by user action, not on app load
 * Uses dynamic import to avoid bundling Capacitor geolocation on web
 * 
 * ANDROID FLOW (using BackgroundLocationPlugin):
 * 1. Check current permission status (detailed)
 * 2. Request foreground permission (triggers system dialog)
 * 3. Optionally request background permission for true background scanning
 * 4. Log all states for debugging
 * 
 * iOS FLOW:
 * Uses standard Capacitor Geolocation plugin
 */
const ensureLocationPermission = async (): Promise<{ granted: boolean; status: string }> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Permission] Not native platform, skipping');
    return { granted: false, status: 'not_native' };
  }
  
  const platform = Capacitor.getPlatform();
  
  try {
    // ANDROID: Use our custom BackgroundLocationPlugin for detailed control
    if (platform === 'android') {
      const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
      
      // Step 1: Check current permission status
      const currentStatus = await BackgroundLocation.getPermissionStatus();
      console.log(`[Permission] android - Current status:`, JSON.stringify(currentStatus));
      
      // Already have foreground permission
      if (currentStatus.fineLocation || currentStatus.coarseLocation) {
        console.log(`[Permission] android - Foreground already granted`);
        
        // On Android 10+, also request background for true background scanning
        if (currentStatus.requiresBackgroundPermission && !currentStatus.backgroundLocation) {
          console.log(`[Permission] android - Requesting background permission...`);
          const bgResult = await BackgroundLocation.requestBackgroundPermission();
          console.log(`[Permission] android - Background result:`, JSON.stringify(bgResult));
        }
        
        return { granted: true, status: 'already_granted' };
      }
      
      // Check if permanently denied
      if (currentStatus.foregroundStatus === 'denied' && !currentStatus.shouldShowForegroundRationale) {
        console.log(`[Permission] android - Permanently denied, must open Settings`);
        return { granted: false, status: 'denied_open_settings' };
      }
      
      // Step 2: Request foreground permission (triggers system dialog)
      console.log(`[Permission] android - Requesting foreground permission...`);
      const fgResult = await BackgroundLocation.requestForegroundPermission();
      console.log(`[Permission] android - Foreground result:`, JSON.stringify(fgResult));
      
      if (!fgResult.granted) {
        console.log(`[Permission] android - Foreground DENIED by user`);
        return { granted: false, status: 'denied' };
      }
      
      // Step 3: Request background permission on Android 10+
      const updatedStatus = await BackgroundLocation.getPermissionStatus();
      if (updatedStatus.requiresBackgroundPermission && !updatedStatus.backgroundLocation) {
        console.log(`[Permission] android - Now requesting background permission...`);
        const bgResult = await BackgroundLocation.requestBackgroundPermission();
        console.log(`[Permission] android - Background result:`, JSON.stringify(bgResult));
        // Don't fail if background is denied - foreground is enough to start
      }
      
      console.log(`[Permission] android - Permission flow complete, foreground GRANTED`);
      return { granted: true, status: 'granted' };
    }
    
    // iOS: Use standard Capacitor Geolocation
    const { Geolocation } = await import('@capacitor/geolocation');
    
    const currentStatus = await Geolocation.checkPermissions();
    console.log(`[Permission] ios - Current status:`, JSON.stringify(currentStatus));
    
    if (currentStatus.location === 'granted') {
      console.log(`[Permission] ios - Already granted`);
      return { granted: true, status: 'already_granted' };
    }
    
    if (currentStatus.location === 'denied') {
      console.log(`[Permission] ios - Previously denied, user must go to Settings`);
      return { granted: false, status: 'denied_open_settings' };
    }
    
    console.log(`[Permission] ios - Requesting permission...`);
    const request = await Geolocation.requestPermissions({
      permissions: ['location']
    });
    console.log(`[Permission] ios - Request result:`, JSON.stringify(request));
    
    const granted = request.location === 'granted' || request.coarseLocation === 'granted';
    
    if (granted) {
      console.log(`[Permission] ios - Permission GRANTED`);
      return { granted: true, status: 'granted' };
    } else {
      console.log(`[Permission] ios - Permission DENIED by user`);
      return { granted: false, status: 'denied' };
    }
  } catch (error) {
    console.error(`[Permission] ${platform} - Error:`, error);
    return { granted: false, status: 'error' };
  }
};

/**
 * Network Contribution Engine Hook - TELCO GRADE
 * 
 * iOS BACKGROUND BEHAVIOR:
 * - Contribution state is PERSISTED across tab switches and app backgrounding
 * - When "Enable Contribution" is tapped, we store the intent persistently
 * - Actual data collection happens on iOS-approved triggers:
 *   1. Location updates (when iOS delivers them)
 *   2. App resume (appStateChange event)
 *   3. Network changes
 * - Points are accumulated and synced when app is active
 * 
 * BUSINESS RULES:
 * 1. CELLULAR ONLY - Users only earn points on mobile data
 * 2. TIME-BASED EARNINGS - points = (distanceMeters * 0.01) + (minutesActive * 0.5)
 * 3. TELCO LOGGING - Log every 100m OR every 5 minutes if stationary
 * 4. SPEED TESTS - Run lightweight speed test every 10 minutes
 */
export const useNetworkContribution = () => {
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';
  const isAndroid = Capacitor.getPlatform() === 'android';
  const { isOnline, connectionType } = useNetworkStatus();
  const { heavyTap, success, warning } = useHaptics();
  const telcoMetrics = useTelcoMetrics();
  
  // Persistent contribution state - survives tab switches and app backgrounding
  const {
    isContributionEnabled,
    sessionId: persistedSessionId,
    sessionStartedAt,
    cumulativePoints,
    cumulativeDurationSeconds,
    enableContribution,
    disableContribution,
    recordCumulativeStats,
    clearCumulativeStats,
    getTimeSinceLastEvent,
    resumeTrigger
  } = useContributionPersistence();
  
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<ContributionSession>({
    id: null,
    startedAt: null,
    status: 'idle'
  });
  
  const [stats, setStats] = useState<ContributionStats>({
    pointsEarned: 0,
    distanceMeters: 0,
    speedKmh: 0,
    dataPointsCount: 0,
    signalLogsCount: 0,
    duration: 0,
    timePoints: 0,
    distancePoints: 0,
    speedTestPoints: 0,
    speedTestCount: 0,
    lastSpeedTest: null
  });
  
  const [isRunningSpeedTest, setIsRunningSpeedTest] = useState(false);

  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  
  const isCellular = isCellularConnection(connectionType);
  const isPaused = session.status === 'active' && !isCellular;
  
  const lastPositionRef = useRef<Position | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speedTestTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimePointsRef = useRef<number>(0);

  // Restore session from persistence on mount or app resume
  useEffect(() => {
    if (isContributionEnabled && persistedSessionId && user && session.status === 'idle') {
      // Check for stale session (exceeded 4 hours)
      if (isSessionStale(sessionStartedAt)) {
        console.log('[NetworkContribution] Session stale (>4h), resetting');
        disableContribution();
        clearCumulativeStats();
        return;
      }
      
      console.log('[NetworkContribution] Restoring persisted session:', persistedSessionId);
      setSession({
        id: persistedSessionId,
        startedAt: sessionStartedAt ? new Date(sessionStartedAt) : new Date(),
        status: 'active'
      });
      
      // Restore cumulative stats
      if (cumulativePoints > 0 || cumulativeDurationSeconds > 0) {
        const offlineSeconds = getTimeSinceLastEvent();
        const totalDuration = cumulativeDurationSeconds + offlineSeconds;
        
        setStats(prev => ({
          ...prev,
          pointsEarned: cumulativePoints,
          duration: totalDuration
        }));
        
        console.log(`[NetworkContribution] Restored ${cumulativePoints} pts, ${totalDuration}s duration (${offlineSeconds}s offline)`);
      }
      
      // Restart timers (geo tracking will be handled by background geolocation hook)
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setStats(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      }
    }
    // Note: startGeoTracking is intentionally not called here to avoid circular deps
    // The useBackgroundGeolocation hook handles its own restoration
  }, [isContributionEnabled, persistedSessionId, user, session.status, resumeTrigger, cumulativePoints, cumulativeDurationSeconds, sessionStartedAt, getTimeSinceLastEvent, disableContribution, clearCumulativeStats]);

  // Position update handler
  const handlePositionUpdate = useCallback(async (position: Position) => {
    if (session.status !== 'active') return;
    
    // Always update position for map display
    setLastPosition(position);
    
    if (!isCellularConnection(connectionType)) {
      lastPositionRef.current = position;
      return;
    }
    
    const speedKmh = (position.coords.speed || 0) * 3.6;
    let distanceGained = 0;
    let distancePoints = 0;

    if (lastPositionRef.current) {
      distanceGained = calculateDistance(lastPositionRef.current, position);
      
      if (distanceGained > 5) {
        distancePoints = distanceGained * 0.01;
        
        setStats(prev => ({
          ...prev,
          distanceMeters: prev.distanceMeters + distanceGained,
          distancePoints: prev.distancePoints + distancePoints,
          pointsEarned: prev.pointsEarned + distancePoints,
          speedKmh: Math.round(speedKmh),
          dataPointsCount: prev.dataPointsCount + 1
        }));
      }
    }
    
    lastPositionRef.current = position;
    
    // Check if we should log a telco-grade data point (100m or 5min)
    if (telcoMetrics.shouldLogDataPoint(position)) {
      await logTelcoDataPoint(position);
    }
    
    // Queue basic data for coverage mapping
    queueContributionData(position);
  }, [session.status, connectionType, telcoMetrics]);

  /**
   * Log a telco-grade signal data point via edge function
   * Includes device integrity signals for anti-fraud
   */
  const logTelcoDataPoint = async (position: Position) => {
    if (!user || !session.id) return;
    
    try {
      const signalLog = await telcoMetrics.createSignalLogEntry(
        position,
        connectionType,
        session.id
      );
      
      // Check device integrity for anti-fraud signals
      const integrity = await checkDeviceIntegrity(signalLog.isMockLocation || false);
      
      // Insert via edge function (handles validation, geohash, country_code derivation)
      const { data, error } = await supabase.functions.invoke('sync-contribution-data', {
        body: {
          signalLogs: [{
            user_id: user.id,
            session_id: session.id,
            latitude: signalLog.latitude,
            longitude: signalLog.longitude,
            accuracy_meters: signalLog.accuracyMeters,
            altitude_meters: signalLog.altitudeMeters,
            speed_mps: signalLog.speedMps,
            heading_degrees: signalLog.headingDegrees,
            rsrp: signalLog.rsrp,
            rsrq: signalLog.rsrq,
            rssi: signalLog.rssi,
            sinr: signalLog.sinr,
            network_type: signalLog.networkType,
            carrier_name: signalLog.carrierName,
            mcc: signalLog.mcc,
            mnc: signalLog.mnc,
            mcc_mnc: signalLog.mccMnc,
            roaming_status: signalLog.roamingStatus,
            speed_test_down: signalLog.speedTestDown,
            speed_test_up: signalLog.speedTestUp,
            latency_ms: signalLog.latencyMs,
            jitter_ms: signalLog.jitterMs,
            device_model: signalLog.deviceModel,
            device_manufacturer: signalLog.deviceManufacturer,
            os_version: signalLog.osVersion,
            cell_id: signalLog.cellId,
            tac: signalLog.tac,
            pci: signalLog.pci,
            band_number: signalLog.bandNumber,
            frequency_mhz: signalLog.frequencyMhz,
            bandwidth_mhz: signalLog.bandwidthMhz,
            recorded_at: signalLog.recordedAt,
            data_quality_score: signalLog.dataQualityScore,
            is_mock_location: integrity.isMockLocation,
            is_indoor: signalLog.accuracyMeters ? signalLog.accuracyMeters > 30 : false,
            speed_test_error: signalLog.speedTestError,
            speed_test_provider: signalLog.speedTestProvider,
            latency_error: signalLog.latencyError,
            latency_provider: signalLog.latencyProvider,
            latency_method: signalLog.latencyMethod,
            // B2B fields
            app_version: '1.0.0', // TODO: Get from app config
            // Device integrity anti-fraud signals
            device_integrity_score: integrity.integrityScore,
            device_integrity_flags: integrity.flags,
          }]
        }
      });
      
      if (error) {
        console.error('Signal log sync error:', error);
        // Queue for offline sync
        queueTelcoData(signalLog, integrity);
      } else {
        const result = data?.signal_logs;
        if (result?.inserted > 0) {
          setStats(prev => ({
            ...prev,
            signalLogsCount: prev.signalLogsCount + result.inserted
          }));
        }
        if (result?.rejected > 0) {
          console.warn('Signal logs rejected:', result.rejected, result.flags);
        }
      }
    } catch (error) {
      console.error('Failed to log telco data:', error);
    }
  };

  /**
   * Queue telco data for offline sync
   */
  const queueTelcoData = (signalLog: SignalLogEntry, integrity?: DeviceIntegrityResult) => {
    const queue = getOfflineQueue();
    queue.push({
      type: 'telco',
      latitude: signalLog.latitude,
      longitude: signalLog.longitude,
      recorded_at: signalLog.recordedAt,
      session_id: signalLog.sessionId,
      telcoMetrics: signalLog,
      deviceIntegrity: integrity,
    });
    saveOfflineQueue(queue);
  };

  const {
    hasPermission,
    isTracking,
    error: geoError,
    requestPermissions,
    startTracking: startGeoTracking,
    stopTracking: stopGeoTracking
  } = useBackgroundGeolocation(handlePositionUpdate);

  // Initialize device info on mount - use telcoMetrics.initDeviceInfo reference only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    telcoMetrics.initDeviceInfo();
  }, []);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();
    
    const queue = getOfflineQueue();
    setOfflineQueueCount(queue.length);
  }, []);

  // Sync offline queue when online
  useEffect(() => {
    if (isOnline && offlineQueueCount > 0 && user) {
      syncOfflineQueue();
    }
  }, [isOnline, offlineQueueCount, user]);

  // Track previous connection type for network change logging
  const prevConnectionTypeRef = useRef(connectionType);
  const prevIsCellularRef = useRef(isCellular);
  
  // Network change detection - log telco data on handoffs (valuable data!)
  useEffect(() => {
    if (session.status !== 'active') {
      prevConnectionTypeRef.current = connectionType;
      prevIsCellularRef.current = isCellular;
      return;
    }
    
    // Check for network type change (LTE→5G, WiFi→LTE, etc.)
    if (prevConnectionTypeRef.current !== connectionType) {
      const shouldLog = telcoMetrics.shouldLogOnNetworkChange(connectionType);
      
      if (shouldLog && lastPosition && isCellular) {
        // Log a telco data point on network handoff - this is valuable data!
        console.log(`[NetworkContribution] Logging handoff: ${prevConnectionTypeRef.current} → ${connectionType}`);
        logTelcoDataPoint(lastPosition);
      }
      
      prevConnectionTypeRef.current = connectionType;
    }
    
    // Haptic feedback on cellular/WiFi change
    if (prevIsCellularRef.current !== isCellular) {
      if (isCellular) {
        success();
        console.log('Cellular connection restored - earning resumed');
      } else {
        warning();
        console.log('WiFi detected - earning paused');
      }
      prevIsCellularRef.current = isCellular;
    }
  }, [connectionType, isCellular, session.status, lastPosition, success, warning, telcoMetrics]);

  // Time-based earnings
  useEffect(() => {
    if (session.status !== 'active' || !isCellular) return;
    
    const currentMinute = Math.floor(stats.duration / 60);
    const lastAwardedMinute = lastTimePointsRef.current;
    
    if (currentMinute > lastAwardedMinute) {
      const minutesElapsed = currentMinute - lastAwardedMinute;
      const timePointsEarned = minutesElapsed * 0.5;
      
      setStats(prev => ({
        ...prev,
        timePoints: prev.timePoints + timePointsEarned,
        pointsEarned: prev.pointsEarned + timePointsEarned
      }));
      
      lastTimePointsRef.current = currentMinute;
    }
  }, [stats.duration, session.status, isCellular]);

  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371e3;
    const lat1 = pos1.coords.latitude * Math.PI / 180;
    const lat2 = pos2.coords.latitude * Math.PI / 180;
    const deltaLat = (pos2.coords.latitude - pos1.coords.latitude) * Math.PI / 180;
    const deltaLon = (pos2.coords.longitude - pos1.coords.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Offline queue management
  const getOfflineQueue = (): OfflineQueueItem[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveOfflineQueue = (queue: OfflineQueueItem[]) => {
    try {
      // P1.2: FIFO cap - drop oldest items if queue exceeds max size
      let trimmedQueue = queue;
      if (queue.length > MAX_OFFLINE_QUEUE_SIZE) {
        const excess = queue.length - MAX_OFFLINE_QUEUE_SIZE;
        trimmedQueue = queue.slice(excess); // Keep newest items
        console.warn(`[OfflineQueue] Exceeded max size (${MAX_OFFLINE_QUEUE_SIZE}). Dropped ${excess} oldest items.`);
      }
      
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmedQueue));
      setOfflineQueueCount(trimmedQueue.length);
      
      // Warn user when queue is getting full (>80% capacity)
      if (trimmedQueue.length > MAX_OFFLINE_QUEUE_SIZE * 0.8) {
        console.warn(`[OfflineQueue] Queue at ${trimmedQueue.length}/${MAX_OFFLINE_QUEUE_SIZE} (${Math.round(trimmedQueue.length / MAX_OFFLINE_QUEUE_SIZE * 100)}% full)`);
      }
    } catch (error) {
      console.error('Failed to save offline queue:', error);
      // P1.2: If localStorage is full (QuotaExceededError), aggressively trim
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[OfflineQueue] localStorage quota exceeded - trimming to 500 items');
        try {
          const reducedQueue = queue.slice(-500); // Keep only last 500
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(reducedQueue));
          setOfflineQueueCount(reducedQueue.length);
        } catch (retryError) {
          console.error('[OfflineQueue] Failed even after trimming:', retryError);
        }
      }
    }
  };

  const queueContributionData = (position: Position) => {
    const item: OfflineQueueItem = {
      type: 'basic',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed_mps: position.coords.speed || undefined,
      accuracy_meters: position.coords.accuracy,
      recorded_at: new Date().toISOString(),
      session_id: session.id || undefined,
      network_type: connectionType,
      device_type: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web'
    };

    const queue = getOfflineQueue();
    queue.push(item);
    saveOfflineQueue(queue);

    // Also log to mining_logs if online and on cellular
    if (isOnline && user && isCellular) {
      supabase.from('mining_logs').insert({
        user_id: user.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        network_type: connectionType,
        device_type: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web'
      }).then(({ error }) => {
        if (error) console.error('Mining log insert error:', error);
      });
    }
  };

  const syncOfflineQueue = async () => {
    if (!user) return;
    
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineQueue] Syncing ${queue.length} items...`);

    try {
      // Separate telco and basic data
      const telcoData = queue.filter(item => item.type === 'telco');
      const basicData = queue.filter(item => item.type === 'basic');
      
      let successfulTelco = 0;
      let successfulBasic = 0;
      
      // Sync telco data via edge function (handles validation, geohash, country_code)
      if (telcoData.length > 0) {
        const signalLogs = telcoData.map(item => ({
          user_id: user.id,
          session_id: item.session_id,
          latitude: item.telcoMetrics?.latitude,
          longitude: item.telcoMetrics?.longitude,
          accuracy_meters: item.telcoMetrics?.accuracyMeters,
          altitude_meters: item.telcoMetrics?.altitudeMeters,
          speed_mps: item.telcoMetrics?.speedMps,
          heading_degrees: item.telcoMetrics?.headingDegrees,
          rsrp: item.telcoMetrics?.rsrp,
          rsrq: item.telcoMetrics?.rsrq,
          rssi: item.telcoMetrics?.rssi,
          sinr: item.telcoMetrics?.sinr,
          network_type: item.telcoMetrics?.networkType,
          carrier_name: item.telcoMetrics?.carrierName,
          mcc: item.telcoMetrics?.mcc,
          mnc: item.telcoMetrics?.mnc,
          mcc_mnc: item.telcoMetrics?.mccMnc,
          roaming_status: item.telcoMetrics?.roamingStatus,
          speed_test_down: item.telcoMetrics?.speedTestDown,
          speed_test_up: item.telcoMetrics?.speedTestUp,
          latency_ms: item.telcoMetrics?.latencyMs,
          jitter_ms: item.telcoMetrics?.jitterMs,
          device_model: item.telcoMetrics?.deviceModel,
          device_manufacturer: item.telcoMetrics?.deviceManufacturer,
          os_version: item.telcoMetrics?.osVersion,
          cell_id: item.telcoMetrics?.cellId,
          tac: item.telcoMetrics?.tac,
          pci: item.telcoMetrics?.pci,
          band_number: item.telcoMetrics?.bandNumber,
          frequency_mhz: item.telcoMetrics?.frequencyMhz,
          bandwidth_mhz: item.telcoMetrics?.bandwidthMhz,
          recorded_at: item.recorded_at,
          data_quality_score: item.telcoMetrics?.dataQualityScore,
          is_mock_location: item.telcoMetrics?.isMockLocation,
          is_indoor: item.telcoMetrics?.accuracyMeters ? item.telcoMetrics.accuracyMeters > 30 : false,
          speed_test_error: item.telcoMetrics?.speedTestError,
          speed_test_provider: item.telcoMetrics?.speedTestProvider,
          latency_error: item.telcoMetrics?.latencyError,
          latency_provider: item.telcoMetrics?.latencyProvider,
          latency_method: item.telcoMetrics?.latencyMethod
        }));
        
        const { data, error: telcoError } = await supabase.functions.invoke('sync-contribution-data', {
          body: { signalLogs }
        });
        
        if (telcoError) {
          console.error('[OfflineQueue] Failed to sync telco data:', telcoError);
          // P1.2: Partial retry - check if it's a rate limit error
          if (telcoError.message?.includes('429') || telcoError.message?.includes('daily_limit')) {
            console.log('[OfflineQueue] Daily limit reached - keeping queue for tomorrow');
            return; // Don't clear queue
          }
        } else {
          const result = data?.signal_logs;
          successfulTelco = result?.inserted || 0;
          console.log(`[OfflineQueue] Synced ${successfulTelco} signal logs, rejected ${result?.rejected || 0}`);
        }
      }
      
      // Sync basic data via edge function
      if (basicData.length > 0) {
        const { data, error } = await supabase.functions.invoke('sync-contribution-data', {
          body: { contributions: basicData }
        });
        
        if (error) {
          console.error('[OfflineQueue] Failed to sync basic data:', error);
          // P1.2: Partial success - only clear telco items if basic failed
          if (successfulTelco > 0) {
            const remainingQueue = queue.filter(item => item.type === 'basic');
            saveOfflineQueue(remainingQueue);
            console.log(`[OfflineQueue] Partial sync: cleared ${telcoData.length} telco items, kept ${basicData.length} basic items`);
            return;
          }
          throw error;
        } else {
          successfulBasic = data?.synced_count || basicData.length;
        }
      }

      // Clear all synced items on full success
      saveOfflineQueue([]);
      console.log(`[OfflineQueue] Fully synced ${queue.length} data points (${successfulTelco} telco, ${successfulBasic} basic)`);
    } catch (error) {
      console.error('[OfflineQueue] Failed to sync offline queue:', error);
    }
  };

  // Start contribution session
  const startContribution = async (): Promise<boolean> => {
    if (!user) {
      warning();
      return false;
    }

    // Request location permission explicitly (user-initiated per Apple guidelines)
    const permissionResult = await ensureLocationPermission();
    console.log('[NetworkContribution] Permission result:', permissionResult);
    
    if (!permissionResult.granted) {
      console.warn('[NetworkContribution] Location permission denied:', permissionResult.status);
      warning();
      
      // If user denied previously, they need to go to Settings
      if (permissionResult.status === 'denied_open_settings') {
        // Dynamic import to avoid web build issues
        try {
          const { App } = await import('@capacitor/app');
          // On Android, we can't directly open app settings, but we can show a toast
          // The user sees "denied_open_settings" status in console
        } catch (e) {
          console.log('[Permission] Could not import App module:', e);
        }
      }
      
      return false;
    }

    heavyTap();

    try {
      const { data: newSession, error } = await supabase
        .from('contribution_sessions')
        .insert({
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // PERSIST the contribution state - survives app backgrounding and tab switches
      enableContribution(newSession.id);
      console.log('[NetworkContribution] Session persisted:', newSession.id);

      setSession({
        id: newSession.id,
        startedAt: new Date(),
        status: 'active'
      });

      // Reset telco logging state
      telcoMetrics.resetLoggingState();
      lastTimePointsRef.current = 0;

      const started = await startGeoTracking();
      if (!started) {
        await supabase
          .from('contribution_sessions')
          .update({ status: 'cancelled' })
          .eq('id', newSession.id);
        
        disableContribution(); // Clear persistence
        setSession({ id: null, startedAt: null, status: 'idle' });
        warning();
        return false;
      }

      // Start Android foreground service for true background scanning
      if (isAndroid) {
        try {
          const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
          await BackgroundLocation.startForegroundService();
          console.log('[NetworkContribution] Android foreground service started');
        } catch (e) {
          console.warn('[NetworkContribution] Could not start foreground service:', e);
          // Continue anyway - foreground tracking will still work
        }
      }

      // Start duration timer
      timerRef.current = setInterval(() => {
        setStats(prev => {
          // Periodically save cumulative stats for persistence
          if (prev.duration > 0 && prev.duration % 30 === 0) {
            recordCumulativeStats(prev.pointsEarned, prev.distanceMeters, prev.duration);
          }
          return { ...prev, duration: prev.duration + 1 };
        });
      }, 1000);

      // Start periodic speed tests (every 10 minutes)
      speedTestTimerRef.current = setInterval(async () => {
        if (isCellular) {
          await runSpeedTestWithBonus();
        }
      }, SPEED_TEST_INTERVAL);

      // Run initial speed test after a short delay (let GPS stabilize)
      setTimeout(() => {
        if (isCellular) runSpeedTestWithBonus();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Failed to start contribution:', error);
      warning();
      return false;
    }
  };

  // Stop contribution session
  const stopContribution = async () => {
    heavyTap();

    await stopGeoTracking();

    // Stop Android foreground service
    if (isAndroid) {
      try {
        const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
        await BackgroundLocation.stopForegroundService();
        console.log('[NetworkContribution] Android foreground service stopped');
      } catch (e) {
        console.warn('[NetworkContribution] Could not stop foreground service:', e);
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (speedTestTimerRef.current) {
      clearInterval(speedTestTimerRef.current);
      speedTestTimerRef.current = null;
    }

    if (session.id && user) {
      try {
        await supabase
          .from('contribution_sessions')
          .update({
            ended_at: new Date().toISOString(),
            status: 'completed',
            total_distance_meters: stats.distanceMeters,
            total_points_earned: Math.floor(stats.pointsEarned),
            data_points_count: stats.dataPointsCount
          })
          .eq('id', session.id);

        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const totalPoints = Math.floor(stats.pointsEarned);

        if (existingPoints) {
          await supabase
            .from('user_points')
            .update({
              total_points: (existingPoints.total_points || 0) + totalPoints,
              total_distance_meters: (existingPoints.total_distance_meters || 0) + stats.distanceMeters,
              total_contribution_time_seconds: (existingPoints.total_contribution_time_seconds || 0) + stats.duration
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              total_points: totalPoints,
              total_distance_meters: stats.distanceMeters,
              total_contribution_time_seconds: stats.duration
            });
        }

        success();
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }

    await syncOfflineQueue();

    // CLEAR the persistent contribution state
    disableContribution();
    clearCumulativeStats();
    console.log('[NetworkContribution] Session cleared from persistence');

    setSession({ id: null, startedAt: null, status: 'completed' });
    setStats({
      pointsEarned: 0,
      distanceMeters: 0,
      speedKmh: 0,
      dataPointsCount: 0,
      signalLogsCount: 0,
      duration: 0,
      timePoints: 0,
      distancePoints: 0,
      speedTestPoints: 0,
      speedTestCount: 0,
      lastSpeedTest: null
    });
    lastPositionRef.current = null;
    lastTimePointsRef.current = 0;
  };

  /**
   * Run a speed test and award bonus points (capped at 5/day)
   */
  const runSpeedTestWithBonus = async (): Promise<SpeedTestResult | null> => {
    if (!isCellular || isRunningSpeedTest) return null;
    
    setIsRunningSpeedTest(true);
    console.log('Running speed test for bonus points...');
    
    try {
      const result = await telcoMetrics.runLightweightSpeedTest(connectionType);
      
      if (result) {
        const speedTestResult: SpeedTestResult = {
          down: result.down ?? 0,
          up: result.up ?? 0,
          latency: result.latency ?? 0,
          timestamp: new Date()
        };
        
        // Only award bonus points if we got actual speed data
        if (result.down !== null || result.latency !== null) {
          // Check daily limit before awarding points
          const testsToday = getSpeedTestsToday();
          const canEarnBonus = testsToday < DAILY_SPEED_TEST_LIMIT;
          
          if (canEarnBonus) {
            // Calculate bonus points
            let bonusPoints = SPEED_TEST_BONUS_POINTS;
            
            // Extra bonus for premium speeds (50+ Mbps)
            if (result.down && result.down >= PREMIUM_SPEED_THRESHOLD) {
              bonusPoints += 1; // Extra point for fast connection
              console.log(`Premium speed detected: ${result.down} Mbps - extra bonus!`);
            }
            
            // Extra bonus for low latency (<50ms)
            if (result.latency && result.latency < 50) {
              bonusPoints += 0.5;
              console.log(`Low latency detected: ${result.latency}ms - extra bonus!`);
            }
            
            setStats(prev => ({
              ...prev,
              speedTestPoints: prev.speedTestPoints + bonusPoints,
              pointsEarned: prev.pointsEarned + bonusPoints,
              speedTestCount: prev.speedTestCount + 1,
              lastSpeedTest: speedTestResult
            }));
            
            // Increment daily count
            incrementSpeedTestCount();
            
            // Haptic feedback for successful test
            success();
            console.log(`Speed test complete (${result.provider}): ↓${result.down ?? 'N/A'} ↑${result.up ?? 'N/A'} Mbps, ${result.latency ?? 'N/A'}ms - +${bonusPoints} pts (${testsToday + 1}/${DAILY_SPEED_TEST_LIMIT} today)`);
          } else {
            // Still count the test but no bonus points
            setStats(prev => ({
              ...prev,
              speedTestCount: prev.speedTestCount + 1,
              lastSpeedTest: speedTestResult
            }));
            console.log(`Speed test complete (${result.provider}): ↓${result.down ?? 'N/A'} ↑${result.up ?? 'N/A'} Mbps - Daily limit reached (${DAILY_SPEED_TEST_LIMIT}/${DAILY_SPEED_TEST_LIMIT}), no bonus`);
          }
          
          // CRITICAL: Immediately sync the speed test data to database
          // Speed test results are cached in telcoMetrics, so we need to trigger a log
          if (lastPosition) {
            console.log('[SpeedTest] Syncing speed test data to database...');
            await logTelcoDataPoint(lastPosition);
          }
        } else {
          console.log(`Speed test completed with errors: download=${result.downloadError}, latency=${result.latencyError}`);
          // Still sync the error data for debugging
          if (lastPosition) {
            await logTelcoDataPoint(lastPosition);
          }
        }
        
        return speedTestResult;
      }
      
      return null;
    } catch (error) {
      console.error('Speed test failed:', error);
      return null;
    } finally {
      setIsRunningSpeedTest(false);
    }
  };

  /**
   * Manually trigger a speed test (user initiated)
   */
  const triggerManualSpeedTest = async (): Promise<SpeedTestResult | null> => {
    if (!isCellular) {
      warning();
      return null;
    }
    heavyTap();
    return runSpeedTestWithBonus();
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
    return Math.round(meters) + ' m';
  };

  return {
    user,
    session,
    stats,
    isTracking,
    hasPermission,
    geoError,
    isOnline,
    connectionType,
    offlineQueueCount,
    lastPosition,
    isCellular,
    isPaused,
    isRunningSpeedTest,
    isContributionEnabled, // Persisted state - survives app backgrounding
    startContribution,
    stopContribution,
    requestPermissions,
    syncOfflineQueue,
    formatDuration,
    formatDistance,
    triggerManualSpeedTest
  };
};
