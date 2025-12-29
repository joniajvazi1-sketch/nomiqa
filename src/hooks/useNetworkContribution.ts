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
  duration: number;
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
 * Network Contribution Engine Hook
 * Manages the full contribution lifecycle including:
 * - Session management
 * - Points calculation
 * - Distance tracking
 * - Offline queue
 * - Database sync
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
    duration: 0
  });

  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  
  const lastPositionRef = useRef<Position | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Position update handler
  const handlePositionUpdate = useCallback((position: Position) => {
    if (session.status !== 'active') return;
    
    const speedKmh = (position.coords.speed || 0) * 3.6;
    let distanceGained = 0;
    let pointsGained = 0;

    if (lastPositionRef.current) {
      distanceGained = calculateDistance(lastPositionRef.current, position);
      
      // Only count if moved more than 5 meters (filter GPS noise)
      if (distanceGained > 5) {
        pointsGained = calculatePoints(distanceGained, speedKmh, 4); // Default signal strength
        
        setStats(prev => ({
          ...prev,
          distanceMeters: prev.distanceMeters + distanceGained,
          pointsEarned: prev.pointsEarned + pointsGained,
          speedKmh: Math.round(speedKmh),
          dataPointsCount: prev.dataPointsCount + 1
        }));
      }
    }
    
    lastPositionRef.current = position;
    
    // Queue the data point
    queueContributionData(position);
  }, [session.status]);

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

  // Calculate points based on contribution quality
  const calculatePoints = (distance: number, speed: number, signalStrength: number): number => {
    // Base: 1 point per 10 meters
    let points = distance / 10;
    
    // Speed bonus (walking/biking earns more than driving)
    if (speed < 10) points *= 1.5; // Walking
    else if (speed < 30) points *= 1.2; // Biking
    // Driving: no bonus
    
    // Signal quality bonus
    points *= (1 + (signalStrength / 10));
    
    return Math.floor(points);
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

    // Also log to mining_logs if online
    if (isOnline && user) {
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

      // Start duration timer
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
            total_points_earned: stats.pointsEarned,
            data_points_count: stats.dataPointsCount
          })
          .eq('id', session.id);

        // Update user_points
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingPoints) {
          await supabase
            .from('user_points')
            .update({
              total_points: (existingPoints.total_points || 0) + stats.pointsEarned,
              total_distance_meters: (existingPoints.total_distance_meters || 0) + stats.distanceMeters,
              total_contribution_time_seconds: (existingPoints.total_contribution_time_seconds || 0) + stats.duration
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_points')
            .insert({
              user_id: user.id,
              total_points: stats.pointsEarned,
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
      duration: 0
    });
    lastPositionRef.current = null;
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
