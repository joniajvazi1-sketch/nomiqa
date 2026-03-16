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
import { secureStorage } from '@/utils/localStorageEncryption';

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
const SPEED_TEST_INTERVAL = 30 * 60 * 1000; // Run speed test every 30 minutes (Wi-Fi only to save data)
const SPEED_TEST_BONUS_POINTS = 2; // Base bonus points per speed test (hook-internal auto-tests, not the standalone SpeedTest component)
const PREMIUM_SPEED_THRESHOLD = 50; // Mbps - extra bonus for fast connections
const DAILY_SPEED_TEST_LIMIT = 3; // Max rewarded speed tests per day (25 pts each)
const SPEED_TEST_DAILY_KEY = 'nomiqa_speed_tests_today';
const MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours max session - runs all day!
const MAX_OFFLINE_QUEUE_SIZE = 1000; // FIFO cap to prevent localStorage overflow
const AUTO_SAVE_INTERVAL_MS = 2 * 60 * 1000; // Auto-save points every 2 minutes (was 5min - users reported reward delays)
const LAST_AUTO_SAVE_KEY = 'nomiqa_last_auto_save';

/**
 * Check if connection type is cellular (earns points)
 */
/**
 * Check if connection type is cellular
 */
const isCellularConnection = (type: string): boolean => {
  const cellularTypes = ['cellular', '4g', '5g', 'lte', '3g', '2g'];
  return cellularTypes.includes(type.toLowerCase());
};

/**
 * Check if connection type is any valid network (cellular or WiFi)
 * WiFi contribution is allowed now (no pause), but telco data from WiFi is less valuable
 */
const isValidConnection = (type: string): boolean => {
  const validTypes = ['cellular', '4g', '5g', 'lte', '3g', '2g', 'wifi'];
  return validTypes.includes(type.toLowerCase());
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
 * iOS FLOW (using IOSBackgroundLocationPlugin):
 * 1. Check current permission status
 * 2. Request "When In Use" permission first
 * 3. If granted, return - background request handled separately via rationale
 * 4. Log all states for debugging
 */
const ensureLocationPermission = async (): Promise<{ granted: boolean; status: string }> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Permission] Not native platform, skipping');
    return { granted: false, status: 'not_native' };
  }

  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';

  try {
    // Both Android and iOS: Use our unified BackgroundLocationPlugin
    const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;

    // Step 1: Check current permission status
    const currentStatus = await BackgroundLocation.getPermissionStatus();
    console.log(`[Permission] ${platform} - Current status:`, JSON.stringify(currentStatus));

    // CRITICAL: For iOS, check foregroundStatus explicitly - don't rely on fineLocation/coarseLocation
    // These may not be set correctly before the first request
    const iosForegroundGranted = isIOS && currentStatus.foregroundStatus === 'granted';
    const androidForegroundGranted = platform === 'android' && (currentStatus.fineLocation || currentStatus.coarseLocation);

    // Already have foreground permission
    if (iosForegroundGranted || androidForegroundGranted) {
      console.log(`[Permission] ${platform} - Foreground already granted`);

      // On Android 10+, also request background for true background scanning
      if (platform === 'android' && currentStatus.requiresBackgroundPermission && !currentStatus.backgroundLocation) {
        console.log(`[Permission] android - Requesting background permission...`);
        const bgResult = await BackgroundLocation.requestBackgroundPermission();
        console.log(`[Permission] android - Background result:`, JSON.stringify(bgResult));
      }

      return { granted: true, status: 'already_granted' };
    }

    // iOS: Prefer Capacitor Geolocation's permission request first.
    // This reliably triggers the system popup AND makes iOS register the permission category
    // so the Location section appears under Settings → Nomiqa.
    if (isIOS) {
      let geoGranted: boolean | null = null;

      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const geoStatus = await Geolocation.requestPermissions();
        geoGranted = geoStatus.location === 'granted' || geoStatus.coarseLocation === 'granted';
        console.log('[Permission] ios - Geolocation.requestPermissions result:', JSON.stringify(geoStatus));
      } catch (e) {
        console.warn('[Permission] ios - Geolocation.requestPermissions failed (continuing):', e);
      }

      if (geoGranted) {
        return { granted: true, status: 'granted' };
      }

      // Re-check after the Geolocation request (in case our native plugin status is lagging)
      try {
        const afterStatus = await BackgroundLocation.getPermissionStatus();
        console.log('[Permission] ios - Status after Geolocation request:', JSON.stringify(afterStatus));
        if (afterStatus.foregroundStatus === 'granted' || afterStatus.backgroundStatus === 'granted') {
          return { granted: true, status: 'granted' };
        }
      } catch (e) {
        console.warn('[Permission] ios - Could not re-check native status after Geolocation request:', e);
      }

      // Fallback: explicit request via our native plugin
      console.log('[Permission] ios - Requesting When In Use authorization (native plugin)...');
      const fgResult = await BackgroundLocation.requestForegroundPermission();
      console.log('[Permission] ios - Foreground result:', JSON.stringify(fgResult));

      if (fgResult.granted) {
        return { granted: true, status: 'granted' };
      }

      // Double-check post-request status for clearer debugging
      try {
        const afterStatus = await BackgroundLocation.getPermissionStatus();
        console.log('[Permission] ios - Status after native request:', JSON.stringify(afterStatus));
      } catch {
        // ignore
      }

      return { granted: false, status: 'denied_open_settings' };
    }

    // Android: Check if permanently denied
    if (currentStatus.foregroundStatus === 'denied' && !currentStatus.shouldShowForegroundRationale) {
      console.log('[Permission] android - Permanently denied, must open Settings');
      return { granted: false, status: 'denied_open_settings' };
    }

    // Step 2: Request foreground permission (triggers system dialog)
    console.log('[Permission] android - Requesting foreground permission...');
    const fgResult = await BackgroundLocation.requestForegroundPermission();
    console.log('[Permission] android - Foreground result:', JSON.stringify(fgResult));

    if (!fgResult.granted) {
      console.log('[Permission] android - Foreground DENIED by user');
      return { granted: false, status: 'denied' };
    }

    // On Android, also request background permission immediately
    const updatedStatus = await BackgroundLocation.getPermissionStatus();
    if (updatedStatus.requiresBackgroundPermission && !updatedStatus.backgroundLocation) {
      console.log('[Permission] android - Now requesting background permission...');
      const bgResult = await BackgroundLocation.requestBackgroundPermission();
      console.log('[Permission] android - Background result:', JSON.stringify(bgResult));
      // Don't fail if background is denied - foreground is enough to start
    }

    console.log('[Permission] android - Permission flow complete, foreground GRANTED');
    return { granted: true, status: 'granted' };
  } catch (error) {
    console.error(`[Permission] ${platform} - Error:`, error);
    return { granted: false, status: 'error' };
  }
};

/**
 * Check iOS permission status and return detailed info
 */
export const getIOSPermissionStatus = async (): Promise<{
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  canRequestBackground: boolean;
  isBackgroundActive: boolean;
}> => {
  if (Capacitor.getPlatform() !== 'ios') {
    return { foregroundGranted: true, backgroundGranted: true, canRequestBackground: false, isBackgroundActive: true };
  }
  
  try {
    const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
    const status = await BackgroundLocation.getPermissionStatus();
    
    return {
      foregroundGranted: status.foregroundStatus === 'granted',
      backgroundGranted: status.backgroundStatus === 'granted',
      canRequestBackground: status.foregroundStatus === 'granted' && status.backgroundStatus !== 'granted',
      isBackgroundActive: status.isBackgroundActive || false
    };
  } catch (error) {
    console.error('[Permission] Failed to get iOS status:', error);
    return { foregroundGranted: false, backgroundGranted: false, canRequestBackground: false, isBackgroundActive: false };
  }
};

/**
 * Request iOS upgrade to "Always" location permission
 * Must only be called after showing BackgroundLocationRationale to user
 */
export const requestIOSAlwaysPermission = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() !== 'ios') return true;
  
  try {
    const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
    const result = await BackgroundLocation.requestBackgroundPermission();
    console.log('[Permission] iOS Always permission result:', JSON.stringify(result));
    return result.granted;
  } catch (error) {
    console.error('[Permission] Failed to request iOS Always:', error);
    return false;
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
 * 2. TIME-BASED EARNINGS - points = (distanceMeters * 0.005) + (minutesActive * 0.1) — slow drip over 24h
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
  
  // Collection preferences from DB - controls battery saver & low power behavior
  const [collectionPrefs, setCollectionPrefs] = useState<{
    battery_saver_mode: boolean;
    low_power_collection: boolean;
    collection_enabled: boolean;
  }>({ battery_saver_mode: false, low_power_collection: false, collection_enabled: true });
  const [isCharging, setIsCharging] = useState(true); // Default true so battery saver doesn't block on web
  
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
  
  // Client-side daily cap tracking to prevent UI from showing inflated numbers
  const CLIENT_DAILY_CAP = 200;
  const [dailyCapReached, setDailyCapReached] = useState(false);
  
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
  const isWifi = connectionType.toLowerCase() === 'wifi';
  // WiFi no longer pauses - only "no network" pauses contribution
  // Battery saver mode: pause if not charging
  const isBatterySaverBlocking = collectionPrefs.battery_saver_mode && !isCharging;
  const isPaused = session.status === 'active' && (!isValidConnection(connectionType) || isBatterySaverBlocking);
  
  const lastPositionRef = useRef<Position | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedTestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimePointsRef = useRef<number>(0);
  const lastAutoSavePointsRef = useRef<number>(0);
  const accessTokenRef = useRef<string | null>(null);

  // Refs for callbacks to avoid dependency array issues
  const disableContributionRef = useRef(disableContribution);
  const clearCumulativeStatsRef = useRef(clearCumulativeStats);
  const getTimeSinceLastEventRef = useRef(getTimeSinceLastEvent);
  disableContributionRef.current = disableContribution;
  clearCumulativeStatsRef.current = clearCumulativeStats;
  getTimeSinceLastEventRef.current = getTimeSinceLastEvent;

  // Fetch collection preferences from DB
  useEffect(() => {
    const fetchPrefs = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase
        .from('user_collection_preferences')
        .select('battery_saver_mode, low_power_collection, collection_enabled')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (data) {
        setCollectionPrefs({
          battery_saver_mode: data.battery_saver_mode ?? false,
          low_power_collection: data.low_power_collection ?? false,
          collection_enabled: data.collection_enabled ?? true,
        });
      }
    };
    fetchPrefs();
    // Re-fetch when app resumes
    const interval = setInterval(fetchPrefs, 60000);
    return () => clearInterval(interval);
  }, []);

  // Monitor charging state for battery saver mode
  useEffect(() => {
    if (!collectionPrefs.battery_saver_mode) return;
    
    // Use Battery API if available (web/Android WebView)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setIsCharging(battery.charging);
        const handler = () => setIsCharging(battery.charging);
        battery.addEventListener('chargingchange', handler);
        return () => battery.removeEventListener('chargingchange', handler);
      }).catch(() => {
        // Battery API not available, default to allowing collection
        setIsCharging(true);
      });
    }
  }, [collectionPrefs.battery_saver_mode]);

  // Restore session from persistence on mount or app resume
  // This enables AUTO-RESUME when iOS relaunches app from significantLocationChange
  useEffect(() => {
    if (isContributionEnabled && persistedSessionId && user && session.status === 'idle') {
      // Check for stale session (exceeded 24 hours)
      if (isSessionStale(sessionStartedAt)) {
        console.log('[NetworkContribution] Session stale (>24h), resetting');
        disableContributionRef.current();
        clearCumulativeStatsRef.current();
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
        const offlineSeconds = getTimeSinceLastEventRef.current();
        const totalDuration = cumulativeDurationSeconds + offlineSeconds;
        
        setStats(prev => ({
          ...prev,
          pointsEarned: cumulativePoints,
          duration: totalDuration
        }));
        
        console.log(`[NetworkContribution] Restored ${cumulativePoints} pts, ${totalDuration}s duration (${offlineSeconds}s offline)`);
      }
      
      // Restart timers (geo tracking will be handled by background geolocation hook)
      // Duration is now calculated from real sessionStartedAt, not incremented
      if (!timerRef.current && sessionStartedAt) {
        timerRef.current = setInterval(() => {
          const realDuration = Math.floor((Date.now() - sessionStartedAt) / 1000);
          setStats(prev => ({ ...prev, duration: realDuration }));
        }, 1000);
      }
      
      // AUTO-RESUME: Restart background location service, drain native stats, and sync with server
      const restartBackgroundTracking = async () => {
        if (!isNative) return;
        
        try {
          const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
          
          // ANDROID: Drain background stats accumulated while JS was paused
          if (isAndroid) {
            try {
              const bgStats = await BackgroundLocation.drainBackgroundStats();
              if (bgStats.distanceMeters > 0 || bgStats.samples > 0) {
                const bgDistancePoints = bgStats.distanceMeters * 0.005;
                console.log(`[NetworkContribution] Drained Android background: ${bgStats.distanceMeters.toFixed(1)}m (+${bgDistancePoints.toFixed(2)} pts), ${bgStats.samples} samples`);
                
                // Merge background distance into current stats
                setStats(prev => ({
                  ...prev,
                  distanceMeters: prev.distanceMeters + bgStats.distanceMeters,
                  distancePoints: prev.distancePoints + bgDistancePoints,
                  pointsEarned: prev.pointsEarned + bgDistancePoints,
                  dataPointsCount: prev.dataPointsCount + bgStats.samples
                }));
              }
            } catch (drainErr) {
              console.warn('[NetworkContribution] Failed to drain Android background stats:', drainErr);
            }
          }
          
          // SYNC WITH SERVER: Fetch the actual capped total from server to sync UI
          try {
            const { data, error } = await supabase.functions.invoke('get-contribution-stats');
            if (!error && data?.points?.total !== undefined) {
              const serverTotal = data.points.total;
              console.log(`[NetworkContribution] Server total points: ${serverTotal}`);
              
              // If server total is LESS than our local count, we've been capped
              // Update local UI to reflect the actual server-verified total
              setStats(prev => {
                if (serverTotal < prev.pointsEarned) {
                  console.log(`[NetworkContribution] Capping UI points from ${prev.pointsEarned} to ${serverTotal}`);
                  lastAutoSavePointsRef.current = serverTotal; // Reset auto-save baseline
                  return { ...prev, pointsEarned: serverTotal };
                }
                return prev;
              });
            }
          } catch (syncErr) {
            console.warn('[NetworkContribution] Failed to sync with server:', syncErr);
          }
          
          // Check if we already have a listener
          if ((window as any).__nomiqaBackgroundLocationListener) {
            console.log('[NetworkContribution] Background listener already exists, skipping');
            return;
          }
          
          // Restart the foreground service
          await BackgroundLocation.startForegroundService();
          console.log('[NetworkContribution] Auto-resumed background service');
          
          // Re-register the location listener
          const listener = await BackgroundLocation.addListener('locationUpdate', (location) => {
            console.log('[NetworkContribution] Background location (auto-resume):', location.latitude, location.longitude);
            
            const position: Position = {
              coords: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                altitude: location.altitude,
                altitudeAccuracy: null,
                heading: null,
                speed: location.speed
              },
              timestamp: location.timestamp
            };
            
            // This will trigger handlePositionUpdate once session is active
            setLastPosition(position);
          });
          
          (window as any).__nomiqaBackgroundLocationListener = listener;
          console.log('[NetworkContribution] Auto-resumed background location listener');
        } catch (e) {
          console.warn('[NetworkContribution] Failed to auto-resume background tracking:', e);
        }
      };
      
      restartBackgroundTracking();
    }
  }, [isContributionEnabled, persistedSessionId, user, session.status, resumeTrigger, cumulativePoints, cumulativeDurationSeconds, sessionStartedAt, isNative, isAndroid]);

  // Position update handler
  const handlePositionUpdate = useCallback(async (position: Position) => {
    if (session.status !== 'active') return;
    
    // Always update position for map display
    setLastPosition(position);
    
    // Battery saver: skip data collection when not charging
    if (isBatterySaverBlocking) {
      lastPositionRef.current = position;
      return;
    }
    
    // Allow both cellular and WiFi for distance tracking
    // WiFi data is less valuable for telco but still earns points
    if (!isValidConnection(connectionType)) {
      lastPositionRef.current = position;
      return;
    }
    
    const speedKmh = (position.coords.speed || 0) * 3.6;
    let distanceGained = 0;
    let distancePoints = 0;

    if (lastPositionRef.current) {
      distanceGained = calculateDistance(lastPositionRef.current, position);
      
      if (distanceGained > 5 && !dailyCapReached) {
        distancePoints = distanceGained * 0.005;
        
        setStats(prev => {
          const newPoints = prev.pointsEarned + distancePoints;
          // Client-side cap: don't let displayed points exceed daily cap
          if (newPoints >= CLIENT_DAILY_CAP) {
            setDailyCapReached(true);
            return {
              ...prev,
              distanceMeters: prev.distanceMeters + distanceGained,
              distancePoints: prev.distancePoints + distancePoints,
              pointsEarned: Math.min(newPoints, CLIENT_DAILY_CAP),
              speedKmh: Math.round(speedKmh),
              dataPointsCount: prev.dataPointsCount + 1
            };
          }
          return {
            ...prev,
            distanceMeters: prev.distanceMeters + distanceGained,
            distancePoints: prev.distancePoints + distancePoints,
            pointsEarned: newPoints,
            speedKmh: Math.round(speedKmh),
            dataPointsCount: prev.dataPointsCount + 1
          };
        });
      }
    }
    
    lastPositionRef.current = position;
    
    // Check if we should log a telco-grade data point (100m or 5min)
    // Low power mode: skip every other log to reduce frequency
    const shouldSkipForLowPower = collectionPrefs.low_power_collection && stats.dataPointsCount % 2 === 1;
    if (telcoMetrics.shouldLogDataPoint(position) && !shouldSkipForLowPower) {
      await logTelcoDataPoint(position);
    }
    
    // Queue basic data for coverage mapping (low power skips every other)
    if (!shouldSkipForLowPower) {
      queueContributionData(position);
    }
  }, [session.status, connectionType, telcoMetrics, isBatterySaverBlocking, collectionPrefs.low_power_collection]);

  // Process lastPosition changes when session is active (for auto-resumed background updates)
  // Use a ref for handlePositionUpdate to avoid re-triggering on every dependency change
  const handlePositionUpdateRef = useRef(handlePositionUpdate);
  handlePositionUpdateRef.current = handlePositionUpdate;
  
  useEffect(() => {
    if (session.status === 'active' && lastPosition && isContributionEnabled) {
      // Only process if this is from a background update (not initial render)
      const listener = (window as any).__nomiqaBackgroundLocationListener;
      if (listener) {
        handlePositionUpdateRef.current(lastPosition);
      }
    }
  }, [lastPosition, session.status, isContributionEnabled]); // Removed handlePositionUpdate from deps

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
            // Device capability (B2B value)
            device_5g_capable: signalLog.device5gCapable ?? null,
            max_supported_generation: signalLog.maxSupportedGeneration ?? null,
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
      // Cache access token for synchronous use in visibilitychange handler
      const { data: { session: sess } } = await supabase.auth.getSession();
      accessTokenRef.current = sess?.access_token || null;
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
    
    // Haptic feedback on cellular/WiFi change (but no longer pauses earning)
    if (prevIsCellularRef.current !== isCellular) {
      if (isCellular) {
        success();
        console.log('Cellular connection detected - telco data more valuable');
      } else if (connectionType.toLowerCase() === 'wifi') {
        // Gentle notification for WiFi - still earning, just different
        console.log('WiFi detected - still earning points');
      }
      prevIsCellularRef.current = isCellular;
    }
  }, [connectionType, isCellular, session.status, lastPosition, success, telcoMetrics]);

  // Time-based earnings - works on both cellular and WiFi
  // Stops accumulating locally once daily cap is reached
  // Rate: 0.1 pts/min (normal) / 0.05 pts/min (low power) — spreads 200 cap across ~24h
  // Battery saver: no points when not charging
  useEffect(() => {
    if (session.status !== 'active' || !isValidConnection(connectionType) || dailyCapReached || isBatterySaverBlocking) return;
    
    const currentMinute = Math.floor(stats.duration / 60);
    const lastAwardedMinute = lastTimePointsRef.current;
    
    if (currentMinute > lastAwardedMinute) {
      const minutesElapsed = currentMinute - lastAwardedMinute;
      const ratePerMinute = collectionPrefs.low_power_collection ? 0.05 : 0.1;
      const timePointsEarned = minutesElapsed * ratePerMinute;
      
      setStats(prev => {
        const newPoints = prev.pointsEarned + timePointsEarned;
        if (newPoints >= CLIENT_DAILY_CAP) {
          setDailyCapReached(true);
          return {
            ...prev,
            timePoints: prev.timePoints + timePointsEarned,
            pointsEarned: Math.min(newPoints, CLIENT_DAILY_CAP)
          };
        }
        return {
          ...prev,
          timePoints: prev.timePoints + timePointsEarned,
          pointsEarned: newPoints
        };
      });
      
      lastTimePointsRef.current = currentMinute;
    }
  }, [stats.duration, session.status, isCellular, dailyCapReached, isBatterySaverBlocking, collectionPrefs.low_power_collection]);

  // AUTO-SAVE: Periodically save points to database (every 5 minutes)
  // This ensures users don't lose points even if they forget to stop or app crashes
  // IMPORTANT: Use a ref to access current stats to avoid recreating the interval on every stats change
  const statsRef = useRef(stats);
  statsRef.current = stats;
  
  useEffect(() => {
    if (session.status !== 'active' || !user || !session.id) {
      // Clear timer if session becomes inactive
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }
    
    // Don't create a new timer if one already exists
    if (autoSaveTimerRef.current) return;
    
    const autoSavePoints = async () => {
      const currentStats = statsRef.current;
      const currentPoints = Math.floor(currentStats.pointsEarned);
      const pointsDelta = currentPoints - lastAutoSavePointsRef.current;
      
      // Only save if there are new points to save (at least 1)
      if (pointsDelta < 1) return;
      
      try {
        console.log(`[NetworkContribution] Auto-saving ${pointsDelta} points (total: ${currentPoints})`);
        
        // Update session progress
        await supabase
          .from('contribution_sessions')
          .update({
            total_distance_meters: currentStats.distanceMeters,
            total_points_earned: currentPoints,
            data_points_count: currentStats.dataPointsCount
          })
          .eq('id', session.id);
        
        // CRITICAL FIX: Use add_points_with_cap RPC to enforce daily/monthly/lifetime caps
        // This prevents client-side bypass of server-side cap enforcement
        const sessionHours = currentStats.duration / 3600; // Convert seconds to hours
        
        const { data: pointsResult, error: pointsError } = await supabase
          .rpc('add_points_with_cap', {
            p_user_id: user.id,
            p_base_points: pointsDelta,
            p_source: 'contribution',
            p_session_hours: sessionHours
          });
        
        if (pointsError) {
          console.error('[NetworkContribution] add_points_with_cap failed:', pointsError);
          // Don't update lastAutoSavePointsRef so we retry next cycle
          return;
        }
        
        if (pointsResult && typeof pointsResult === 'object') {
          const result = pointsResult as Record<string, unknown>;
          const actualPointsAdded = (result.points_added as number) || 0;
          const wasCapped = result.daily_capped || result.monthly_capped || result.lifetime_capped;
          const reason = result.reason as string | undefined;
          
          if (reason === 'daily_cap_reached') {
            console.log('[NetworkContribution] Daily cap reached - pausing point accrual');
            setDailyCapReached(true);
          } else if (reason === 'monthly_cap_reached') {
            console.log('[NetworkContribution] Monthly cap reached - pausing point accrual');
            setDailyCapReached(true); // Also stop local accumulation
          } else if (reason === 'lifetime_cap_reached') {
            console.log('[NetworkContribution] Lifetime cap reached - congrats!');
            setDailyCapReached(true);
          } else if (reason === 'account_frozen') {
            console.warn('[NetworkContribution] Account frozen - points not added');
            setDailyCapReached(true);
          }
          
          if (wasCapped) {
            console.log(`[NetworkContribution] Points capped: requested ${pointsDelta}, added ${actualPointsAdded}`);
            // Don't abruptly reset the UI value — keep displayed value stable
            // The server already enforced the cap, so the DB is correct
            // Just stop incrementing locally until the cap resets
            const capMessage = reason === 'daily_cap_reached'
              ? 'Daily earning limit reached. Points will resume tomorrow!'
              : reason === 'monthly_cap_reached'
              ? 'Monthly earning limit reached. Resets next month!'
              : reason === 'lifetime_cap_reached'
              ? 'Lifetime cap reached — congratulations on your contribution!'
              : reason === 'account_frozen'
              ? 'Account temporarily frozen. Contact support.'
              : 'Earning limit reached. Points will resume soon!';
            
            // Import toast dynamically to avoid circular deps
            import('sonner').then(({ toast }) => {
              toast.info(capMessage, { id: 'points-cap', duration: 6000 });
            });
          } else {
            const boostMultiplier = (result.boost_multiplier as number) || 1;
            const streakDays = (result.streak_days as number) || 0;
            console.log(`[NetworkContribution] Points added: ${actualPointsAdded} (boost: ${boostMultiplier}x, streak: ${streakDays}d)`);
          }
        }
        
        lastAutoSavePointsRef.current = currentPoints;
        localStorage.setItem(LAST_AUTO_SAVE_KEY, Date.now().toString());
        console.log('[NetworkContribution] Auto-save completed');
      } catch (error) {
        console.error('[NetworkContribution] Auto-save failed:', error);
      }
    };
    
    // Start auto-save timer
    autoSaveTimerRef.current = setInterval(autoSavePoints, AUTO_SAVE_INTERVAL_MS);
    
    // IMMEDIATE SAVE on visibility change / app pause
    // This ensures points are persisted the instant the user switches away or the OS suspends
    const immediateSave = () => {
      if (document.visibilityState !== 'visible') {
        const currentStats = statsRef.current;
        const currentPoints = Math.floor(currentStats.pointsEarned);
        const pointsDelta = currentPoints - lastAutoSavePointsRef.current;
        if (pointsDelta >= 1 && user) {
          console.log(`[NetworkContribution] Immediate save on hide: ${pointsDelta} points`);
          // Use sendBeacon-style fire-and-forget via fetch keepalive for reliability
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          if (supabaseUrl && supabaseKey) {
            const body = JSON.stringify({
              p_user_id: user.id,
              p_base_points: pointsDelta,
              p_source: 'contribution',
              p_session_hours: currentStats.duration / 3600
            });
            try {
              fetch(`${supabaseUrl}/rest/v1/rpc/add_points_with_cap`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${accessTokenRef.current || supabaseKey}`,
                },
                body,
                keepalive: true, // Survives page unload
              }).catch(() => {}); // Best effort
              lastAutoSavePointsRef.current = currentPoints;
              localStorage.setItem(LAST_AUTO_SAVE_KEY, Date.now().toString());
            } catch {
              // Best effort - don't block
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', immediateSave);
    window.addEventListener('pagehide', immediateSave);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', immediateSave);
      window.removeEventListener('pagehide', immediateSave);
    };
  }, [session.status, session.id, user?.id]); // Only depend on session state and user, not stats

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

  // Offline queue management with encryption
  // Use a ref to cache the queue to avoid async issues in sync callbacks
  const offlineQueueCacheRef = useRef<OfflineQueueItem[]>([]);
  const queueLoadedRef = useRef(false);

  // Load queue on mount (async)
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const stored = await secureStorage.getItem(OFFLINE_QUEUE_KEY);
        const queue = stored ? JSON.parse(stored) : [];
        offlineQueueCacheRef.current = queue;
        setOfflineQueueCount(queue.length);
        queueLoadedRef.current = true;
      } catch (error) {
        console.error('[OfflineQueue] Failed to load encrypted queue:', error);
        offlineQueueCacheRef.current = [];
        queueLoadedRef.current = true;
      }
    };
    loadQueue();
  }, []);

  const getOfflineQueue = (): OfflineQueueItem[] => {
    return offlineQueueCacheRef.current;
  };

  const saveOfflineQueue = async (queue: OfflineQueueItem[]) => {
    try {
      // P1.2: FIFO cap - drop oldest items if queue exceeds max size
      let trimmedQueue = queue;
      if (queue.length > MAX_OFFLINE_QUEUE_SIZE) {
        const excess = queue.length - MAX_OFFLINE_QUEUE_SIZE;
        trimmedQueue = queue.slice(excess); // Keep newest items
        console.warn(`[OfflineQueue] Exceeded max size (${MAX_OFFLINE_QUEUE_SIZE}). Dropped ${excess} oldest items.`);
      }
      
      // Update cache immediately for sync access
      offlineQueueCacheRef.current = trimmedQueue;
      setOfflineQueueCount(trimmedQueue.length);
      
      // Save encrypted data asynchronously
      await secureStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmedQueue));
      
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
          offlineQueueCacheRef.current = reducedQueue;
          await secureStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(reducedQueue));
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
          latency_method: item.telcoMetrics?.latencyMethod,
          // Device capability (B2B value)
          device_5g_capable: item.telcoMetrics?.device5gCapable ?? null,
          max_supported_generation: item.telcoMetrics?.maxSupportedGeneration ?? null,
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

  // Start contribution session - fully guarded against uncaught exceptions
  const startContribution = async (): Promise<boolean> => {
    if (!user) {
      warning();
      return false;
    }

    // Request location permission explicitly (user-initiated per Apple guidelines)
    let permissionResult: { granted: boolean; status: string };
    try {
      permissionResult = await ensureLocationPermission();
    } catch (permErr) {
      console.error('[NetworkContribution] Permission check crashed:', permErr);
      warning();
      return false;
    }
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
      
      // ANDROID: Reset background stats when starting fresh session
      if (isAndroid && isNative) {
        try {
          const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
          await BackgroundLocation.resetBackgroundStats();
          console.log('[NetworkContribution] Android background stats reset for new session');
        } catch (e) {
          console.warn('[NetworkContribution] Failed to reset Android background stats:', e);
        }
      }

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

      // Start background location service for true background scanning
      // Works on both Android (foreground service) and iOS (significant location changes)
      if (isNative) {
        try {
          const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
          await BackgroundLocation.startForegroundService();
          console.log(`[NetworkContribution] ${isAndroid ? 'Android' : 'iOS'} background service started`);
          
          // Listen for background location updates from native plugin
          const listener = await BackgroundLocation.addListener('locationUpdate', (location) => {
            console.log('[NetworkContribution] Background location update:', location.latitude, location.longitude);
            
            // Convert to Position format and handle
            const position: Position = {
              coords: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                altitude: location.altitude,
                altitudeAccuracy: null,
                heading: null,
                speed: location.speed
              },
              timestamp: location.timestamp
            };
            
            // Process background location update
            handlePositionUpdate(position);
          });
          
          // Store listener for cleanup
          (window as any).__nomiqaBackgroundLocationListener = listener;
          console.log('[NetworkContribution] Background location listener registered');
        } catch (e) {
          console.warn('[NetworkContribution] Could not start background service:', e);
          // Continue anyway - foreground tracking will still work
        }
      }

      // Start duration timer - uses real elapsed time from session start
      const timerStartedAt = Date.now();
      timerRef.current = setInterval(() => {
        const realDuration = Math.floor((Date.now() - timerStartedAt) / 1000);
        setStats(prev => {
          // Periodically save cumulative stats for persistence
          if (realDuration > 0 && realDuration % 30 === 0) {
            recordCumulativeStats(prev.pointsEarned, prev.distanceMeters, realDuration);
          }
          return { ...prev, duration: realDuration };
        });
      }, 1000);

      // Start periodic speed tests (Wi-Fi only to save cellular data)
      // Low power mode: double the interval to reduce activity
      const speedTestInterval = collectionPrefs.low_power_collection ? SPEED_TEST_INTERVAL * 2 : SPEED_TEST_INTERVAL;
      speedTestTimerRef.current = setInterval(async () => {
        // CRITICAL: Only run speed tests on Wi-Fi to prevent massive cellular data usage
        if (connectionType.toLowerCase() === 'wifi' && !isBatterySaverBlocking) {
          await runSpeedTestWithBonus();
        } else {
          console.log('[NetworkContribution] Skipping speed test (cellular/battery saver)');
        }
      }, speedTestInterval);

      // Run initial speed test after a short delay (Wi-Fi only)
      setTimeout(() => {
        if (connectionType.toLowerCase() === 'wifi') {
          runSpeedTestWithBonus();
        } else {
          console.log('[NetworkContribution] Skipping initial speed test on cellular');
        }
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

    // Stop background location service and clean up listener (Android & iOS)
    if (isNative) {
      try {
        // Clean up background location listener
        const listener = (window as any).__nomiqaBackgroundLocationListener;
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
          (window as any).__nomiqaBackgroundLocationListener = null;
          console.log('[NetworkContribution] Background location listener removed');
        }
        
        // Stop the foreground service
        const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
        await BackgroundLocation.stopForegroundService();
        console.log(`[NetworkContribution] ${isAndroid ? 'Android' : 'iOS'} foreground service stopped`);
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
    
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
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

        // Only save the REMAINING points not yet auto-saved
        const remainingPoints = Math.floor(stats.pointsEarned) - lastAutoSavePointsRef.current;
        const pointsToSave = Math.max(0, remainingPoints);
        
        console.log(`[NetworkContribution] Final save: ${pointsToSave} remaining points (${lastAutoSavePointsRef.current} already auto-saved)`);

        if (pointsToSave > 0) {
          // CRITICAL FIX: Use add_points_with_cap RPC instead of direct update
          // This ensures daily/monthly/lifetime caps are enforced on final save too
          const sessionHours = stats.duration / 3600;
          const { data: pointsResult, error: pointsError } = await supabase
            .rpc('add_points_with_cap', {
              p_user_id: user.id,
              p_base_points: pointsToSave,
              p_source: 'contribution',
              p_session_hours: sessionHours
            });
          
          if (pointsError) {
            console.error('[NetworkContribution] Final add_points_with_cap failed:', pointsError);
          } else {
            const result = pointsResult as Record<string, unknown> | null;
            console.log(`[NetworkContribution] Final save result: added ${result?.points_added || 0} points`);
          }
        }

        // Update distance and contribution time (these aren't capped)
        // Read current values first, then add session delta atomically
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('total_distance_meters, total_contribution_time_seconds')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingPoints) {
          await supabase
            .from('user_points')
            .update({
              total_distance_meters: (existingPoints.total_distance_meters || 0) + stats.distanceMeters,
              total_contribution_time_seconds: (existingPoints.total_contribution_time_seconds || 0) + stats.duration
            })
            .eq('user_id', user.id);
        }

        success();
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
    
    // Reset auto-save tracker
    lastAutoSavePointsRef.current = 0;

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
   * Works on both cellular and WiFi
   * Returns estimated data usage info for cellular warning
   */
  const triggerManualSpeedTest = async (skipCellularWarning = false): Promise<SpeedTestResult | null> => {
    // On WiFi, just run it
    if (connectionType.toLowerCase() === 'wifi') {
      heavyTap();
      return runSpeedTestWithBonus();
    }
    
    // On cellular, warn about data usage (~3-25MB per test)
    if (!skipCellularWarning) {
      // Return null to let UI show warning first
      // UI should call again with skipCellularWarning=true after user confirms
      return null;
    }
    
    heavyTap();
    return runSpeedTestWithBonus();
  };

  /**
   * Get estimated data usage for speed test
   */
  const getSpeedTestDataEstimate = (): { minMB: number; maxMB: number; isCellular: boolean } => ({
    minMB: 3,
    maxMB: 25,
    isCellular
  });

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
    isWifi,
    isPaused,
    isBatterySaverBlocking,
    isRunningSpeedTest,
    isContributionEnabled, // Persisted state - survives app backgrounding
    startContribution,
    stopContribution,
    requestPermissions,
    syncOfflineQueue,
    formatDuration,
    formatDistance,
    triggerManualSpeedTest,
    getSpeedTestDataEstimate,
    getRewardedTestsRemaining: () => Math.max(0, DAILY_SPEED_TEST_LIMIT - getSpeedTestsToday()),
    dailySpeedTestLimit: DAILY_SPEED_TEST_LIMIT,
  };
};
