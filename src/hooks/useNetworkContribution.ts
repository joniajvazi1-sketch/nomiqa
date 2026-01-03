import { useState, useCallback, useRef, useEffect } from 'react';
import { Position } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { useBackgroundGeolocation } from './useBackgroundGeolocation';
import { useNetworkStatus } from './useNetworkStatus';
import { useHaptics } from './useHaptics';
import { usePlatform } from './usePlatform';
import { useTelcoMetrics, SignalLogEntry } from './useTelcoMetrics';

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
}

const OFFLINE_QUEUE_KEY = 'nomiqa_offline_contribution_queue';
const SPEED_TEST_INTERVAL = 10 * 60 * 1000; // Run speed test every 10 minutes
const SPEED_TEST_BONUS_POINTS = 2; // Bonus points per speed test
const PREMIUM_SPEED_THRESHOLD = 50; // Mbps - extra bonus for fast connections

/**
 * Check if connection type is cellular (earns points)
 */
const isCellularConnection = (type: string): boolean => {
  const cellularTypes = ['cellular', '4g', '5g', 'lte', '3g', '2g'];
  return cellularTypes.includes(type.toLowerCase());
};

/**
 * Network Contribution Engine Hook - TELCO GRADE
 * 
 * BUSINESS RULES:
 * 1. CELLULAR ONLY - Users only earn points on mobile data
 * 2. TIME-BASED EARNINGS - points = (distanceMeters * 0.01) + (minutesActive * 0.5)
 * 3. TELCO LOGGING - Log every 100m OR every 5 minutes if stationary
 * 4. SPEED TESTS - Run lightweight speed test every 10 minutes
 */
export const useNetworkContribution = () => {
  const { isNative, isIOS, isAndroid } = usePlatform();
  const { isOnline, connectionType } = useNetworkStatus();
  const { heavyTap, success, warning } = useHaptics();
  const telcoMetrics = useTelcoMetrics();
  
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
   * Log a telco-grade signal data point to the database
   */
  const logTelcoDataPoint = async (position: Position) => {
    if (!user || !session.id) return;
    
    try {
      const signalLog = await telcoMetrics.createSignalLogEntry(
        position,
        connectionType,
        session.id
      );
      
      // Insert into signal_logs table
      const { error } = await supabase.from('signal_logs').insert({
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
        recorded_at: signalLog.recordedAt
      });
      
      if (error) {
        console.error('Signal log insert error:', error);
        // Queue for offline sync
        queueTelcoData(signalLog);
      } else {
        setStats(prev => ({
          ...prev,
          signalLogsCount: prev.signalLogsCount + 1
        }));
      }
    } catch (error) {
      console.error('Failed to log telco data:', error);
    }
  };

  /**
   * Queue telco data for offline sync
   */
  const queueTelcoData = (signalLog: SignalLogEntry) => {
    const queue = getOfflineQueue();
    queue.push({
      type: 'telco',
      latitude: signalLog.latitude,
      longitude: signalLog.longitude,
      recorded_at: signalLog.recordedAt,
      session_id: signalLog.sessionId,
      telcoMetrics: signalLog
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

  // Track previous cellular state for haptic feedback on change
  const prevIsCellularRef = useRef(isCellular);
  
  // Haptic feedback when connection type changes during active session
  useEffect(() => {
    if (session.status !== 'active') {
      prevIsCellularRef.current = isCellular;
      return;
    }
    
    // Connection changed during active session
    if (prevIsCellularRef.current !== isCellular) {
      if (isCellular) {
        // Switched to cellular - resume earning
        success();
        console.log('Cellular connection restored - mining resumed');
      } else {
        // Switched to WiFi - paused
        warning();
        console.log('WiFi detected - mining paused');
      }
      prevIsCellularRef.current = isCellular;
    }
  }, [isCellular, session.status, success, warning]);

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
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      setOfflineQueueCount(queue.length);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
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

    try {
      // Separate telco and basic data
      const telcoData = queue.filter(item => item.type === 'telco');
      const basicData = queue.filter(item => item.type === 'basic');
      
      // Sync telco data directly to signal_logs
      if (telcoData.length > 0) {
        const telcoInserts = telcoData.map(item => ({
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
          recorded_at: item.recorded_at
        }));
        
        const { error: telcoError } = await supabase
          .from('signal_logs')
          .insert(telcoInserts);
        
        if (telcoError) {
          console.error('Failed to sync telco data:', telcoError);
        }
      }
      
      // Sync basic data via edge function
      if (basicData.length > 0) {
        const { error } = await supabase.functions.invoke('sync-contribution-data', {
          body: { contributions: basicData }
        });
        
        if (error) throw error;
      }

      // Clear synced items
      saveOfflineQueue([]);
      console.log(`Synced ${queue.length} data points (${telcoData.length} telco, ${basicData.length} basic)`);
    } catch (error) {
      console.error('Failed to sync offline queue:', error);
    }
  };

  // Start contribution session
  const startContribution = async (): Promise<boolean> => {
    if (!user) {
      warning();
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
        
        setSession({ id: null, startedAt: null, status: 'idle' });
        warning();
        return false;
      }

      // Start duration timer
      timerRef.current = setInterval(() => {
        setStats(prev => ({ ...prev, duration: prev.duration + 1 }));
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
   * Run a speed test and award bonus points
   */
  const runSpeedTestWithBonus = async (): Promise<SpeedTestResult | null> => {
    if (!isCellular || isRunningSpeedTest) return null;
    
    setIsRunningSpeedTest(true);
    console.log('Running speed test for bonus points...');
    
    try {
      const result = await telcoMetrics.runLightweightSpeedTest();
      
      if (result) {
        const speedTestResult: SpeedTestResult = {
          down: result.down,
          up: result.up,
          latency: result.latency,
          timestamp: new Date()
        };
        
        // Calculate bonus points
        let bonusPoints = SPEED_TEST_BONUS_POINTS;
        
        // Extra bonus for premium speeds (50+ Mbps)
        if (result.down >= PREMIUM_SPEED_THRESHOLD) {
          bonusPoints += 1; // Extra point for fast connection
          console.log(`Premium speed detected: ${result.down} Mbps - extra bonus!`);
        }
        
        // Extra bonus for low latency (<50ms)
        if (result.latency < 50) {
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
        
        // Haptic feedback for successful test
        success();
        console.log(`Speed test complete: ↓${result.down} ↑${result.up} Mbps, ${result.latency}ms - +${bonusPoints} pts`);
        
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
    startContribution,
    stopContribution,
    requestPermissions,
    syncOfflineQueue,
    formatDuration,
    formatDistance,
    triggerManualSpeedTest
  };
};
