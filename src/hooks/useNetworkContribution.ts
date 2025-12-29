import { useState, useCallback, useRef, useEffect } from 'react';
import { Position } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { useBackgroundGeolocation } from './useBackgroundGeolocation';
import { useNetworkStatus } from './useNetworkStatus';
import { useHaptics } from './useHaptics';
import { usePlatform } from './usePlatform';

interface ContributionStats {
  pointsEarned: number;
  distanceMeters: number;
  speedKmh: number;
  dataPointsCount: number;
  duration: number; // in seconds
  timePoints: number; // Points earned from time
  distancePoints: number; // Points earned from distance
}

interface ContributionSession {
  id: string | null;
  startedAt: Date | null;
  status: 'idle' | 'active' | 'paused' | 'completed';
}

interface OfflineQueueItem {
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
}

const OFFLINE_QUEUE_KEY = 'nomiqa_offline_contribution_queue';

/**
 * Check if connection type is cellular (earns points)
 * WiFi and 'none' do NOT earn points - we are a DePIN for Mobile Networks
 */
const isCellularConnection = (type: string): boolean => {
  const cellularTypes = ['cellular', '4g', '5g', 'lte', '3g', '2g'];
  return cellularTypes.includes(type.toLowerCase());
};

/**
 * Network Contribution Engine Hook
 * 
 * BUSINESS RULES:
 * 1. CELLULAR ONLY - Users only earn points on mobile data (4G/5G/LTE)
 *    WiFi and offline connections pause mining
 * 
 * 2. TIME-BASED EARNINGS - Users earn even when stationary
 *    Formula: points = (distanceMeters * 0.01) + (minutesActive * 0.5)
 */
export const useNetworkContribution = () => {
  const { isNative, isIOS, isAndroid } = usePlatform();
  const { isOnline, connectionType } = useNetworkStatus();
  const { heavyTap, success, warning } = useHaptics();
  
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
    duration: 0,
    timePoints: 0,
    distancePoints: 0
  });

  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  
  // Is the current connection cellular (earnable)?
  const isCellular = isCellularConnection(connectionType);
  const isPaused = session.status === 'active' && !isCellular;
  
  const lastPositionRef = useRef<Position | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimePointsRef = useRef<number>(0); // Track last time points were awarded

  // Position update handler - only process on cellular
  const handlePositionUpdate = useCallback((position: Position) => {
    if (session.status !== 'active') return;
    
    // CRITICAL: Only process data on cellular connections
    if (!isCellularConnection(connectionType)) {
      // Still update position for map display, but don't earn points
      lastPositionRef.current = position;
      setLastPosition(position);
      return;
    }
    
    const speedKmh = (position.coords.speed || 0) * 3.6;
    let distanceGained = 0;
    let distancePoints = 0;

    if (lastPositionRef.current) {
      distanceGained = calculateDistance(lastPositionRef.current, position);
      
      // Only count if moved more than 5 meters (filter GPS noise)
      if (distanceGained > 5) {
        // NEW FORMULA: Distance points = distance * 0.01
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
    setLastPosition(position);
    
    // Queue the data point for cellular coverage mapping
    queueContributionData(position);
  }, [session.status, connectionType]);

  const {
    hasPermission,
    isTracking,
    error: geoError,
    requestPermissions,
    startTracking: startGeoTracking,
    stopTracking: stopGeoTracking
  } = useBackgroundGeolocation(handlePositionUpdate);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();
    
    // Load offline queue count
    const queue = getOfflineQueue();
    setOfflineQueueCount(queue.length);
  }, []);

  // Sync offline queue when online
  useEffect(() => {
    if (isOnline && offlineQueueCount > 0 && user) {
      syncOfflineQueue();
    }
  }, [isOnline, offlineQueueCount, user]);

  // TIME-BASED EARNINGS: Award points every minute on cellular
  useEffect(() => {
    if (session.status !== 'active' || !isCellular) return;
    
    const currentMinute = Math.floor(stats.duration / 60);
    const lastAwardedMinute = lastTimePointsRef.current;
    
    // Award 0.5 points per minute on cellular
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

  // Calculate distance between two positions (Haversine formula)
  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371e3; // Earth's radius in meters
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
      const { data, error } = await supabase.functions.invoke('sync-contribution-data', {
        body: { contributions: queue }
      });

      if (error) throw error;

      // Clear synced items
      saveOfflineQueue([]);
      console.log(`Synced ${queue.length} contribution data points`);
    } catch (error) {
      console.error('Failed to sync offline queue:', error);
    }
  };

  // Start a contribution session
  const startContribution = async (): Promise<boolean> => {
    if (!user) {
      warning();
      return false;
    }

    heavyTap();

    // Create session in database
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

      // Reset time points tracker
      lastTimePointsRef.current = 0;

      // Start location tracking
      const started = await startGeoTracking();
      if (!started) {
        // Rollback session
        await supabase
          .from('contribution_sessions')
          .update({ status: 'cancelled' })
          .eq('id', newSession.id);
        
        setSession({ id: null, startedAt: null, status: 'idle' });
        warning();
        return false;
      }

      // Start duration timer (runs regardless of connection type)
      timerRef.current = setInterval(() => {
        setStats(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

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

    // Stop location tracking
    await stopGeoTracking();

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update session in database
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

        // Update user_points
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

    // Sync any remaining offline data
    await syncOfflineQueue();

    // Reset state
    setSession({ id: null, startedAt: null, status: 'completed' });
    setStats({
      pointsEarned: 0,
      distanceMeters: 0,
      speedKmh: 0,
      dataPointsCount: 0,
      duration: 0,
      timePoints: 0,
      distancePoints: 0
    });
    lastPositionRef.current = null;
    lastTimePointsRef.current = 0;
  };

  // Format helpers
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
    // State
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
    
    // Cellular-specific state
    isCellular,
    isPaused, // True when active but not on cellular
    
    // Actions
    startContribution,
    stopContribution,
    requestPermissions,
    syncOfflineQueue,
    
    // Helpers
    formatDuration,
    formatDistance
  };
};
