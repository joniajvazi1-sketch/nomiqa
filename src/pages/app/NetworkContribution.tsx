import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, 
  Signal, 
  Gauge, 
  MapPin,
  Pause,
  Play,
  AlertTriangle,
  Wifi,
  Battery
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useHaptics } from '@/hooks/useHaptics';
import { usePlatform } from '@/hooks/usePlatform';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import { Geolocation, Position } from '@capacitor/geolocation';
import { cn } from '@/lib/utils';

interface ContributionStats {
  pointsEarned: number;
  distanceMeters: number;
  speedKmh: number;
  signalStrength: number;
  networkType: string;
  duration: number;
}

/**
 * Network Contribution Page - The "Mining" feature
 * Dark futuristic UI with real-time stats and background geolocation
 */
export const NetworkContribution: React.FC = () => {
  const { heavyTap, success, warning } = useHaptics();
  const { isNative, isIOS, isAndroid } = usePlatform();
  const { isOnline, connectionType } = useNetworkStatus();
  
  const [isContributing, setIsContributing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showBatteryWarning, setShowBatteryWarning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [stats, setStats] = useState<ContributionStats>({
    pointsEarned: 0,
    distanceMeters: 0,
    speedKmh: 0,
    signalStrength: 4,
    networkType: '4G',
    duration: 0
  });
  
  const watchIdRef = useRef<string | null>(null);
  const lastPositionRef = useRef<Position | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    checkAuth();
    checkPermissions();
    
    // Show battery warning on Android (iOS handles this better)
    if (isAndroid) {
      setShowBatteryWarning(true);
    }

    return () => {
      stopContributing();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await Geolocation.checkPermissions();
      setHasPermission(status.location === 'granted' || status.coarseLocation === 'granted');
    } catch (error) {
      console.warn('Permission check failed:', error);
      setHasPermission(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const status = await Geolocation.requestPermissions();
      const granted = status.location === 'granted' || status.coarseLocation === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

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

  const calculatePoints = (distance: number, speed: number, signalStrength: number): number => {
    // Base points: 1 point per 10 meters
    let points = distance / 10;
    
    // Speed bonus (walking/biking earns more than driving)
    if (speed < 10) points *= 1.5; // Walking
    else if (speed < 30) points *= 1.2; // Biking
    // Driving: no bonus
    
    // Signal quality bonus
    points *= (1 + (signalStrength / 10));
    
    return Math.floor(points);
  };

  const startContributing = async () => {
    if (!user) {
      warning();
      return;
    }

    let permission = hasPermission;
    if (!permission) {
      permission = await requestPermissions();
      if (!permission) {
        warning();
        return;
      }
    }

    heavyTap();
    
    // Create session in database
    try {
      const { data: session, error } = await supabase
        .from('contribution_sessions')
        .insert({
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      setSessionId(session.id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }

    setIsContributing(true);
    
    // Start location watching
    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('Position error:', err);
            return;
          }
          if (position) {
            handlePositionUpdate(position);
          }
        }
      );
      watchIdRef.current = id;
    } catch (error) {
      console.error('Watch position failed:', error);
    }

    // Start duration timer
    timerRef.current = setInterval(() => {
      setStats(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  const handlePositionUpdate = useCallback((position: Position) => {
    const speedKmh = (position.coords.speed || 0) * 3.6;
    
    if (lastPositionRef.current) {
      const distance = calculateDistance(lastPositionRef.current, position);
      
      // Only count if moved more than 5 meters (filter GPS noise)
      if (distance > 5) {
        const points = calculatePoints(distance, speedKmh, stats.signalStrength);
        
        setStats(prev => ({
          ...prev,
          distanceMeters: prev.distanceMeters + distance,
          pointsEarned: prev.pointsEarned + points,
          speedKmh: Math.round(speedKmh)
        }));
      }
    }
    
    lastPositionRef.current = position;
    
    // Log to mining_logs table (existing table)
    logContribution(position);
  }, [stats.signalStrength]);

  const logContribution = async (position: Position) => {
    if (!user) return;
    
    try {
      await supabase.from('mining_logs').insert({
        user_id: user.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        signal_dbm: null, // Would need native plugin for actual signal
        network_type: connectionType,
        carrier: null,
        device_type: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web'
      });
    } catch (error) {
      console.error('Failed to log contribution:', error);
    }
  };

  const stopContributing = async () => {
    heavyTap();
    setIsContributing(false);

    // Clear watch
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update session in database
    if (sessionId && user) {
      try {
        await supabase
          .from('contribution_sessions')
          .update({
            ended_at: new Date().toISOString(),
            status: 'completed',
            total_distance_meters: stats.distanceMeters,
            total_points_earned: stats.pointsEarned
          })
          .eq('id', sessionId);

        // Update user_points
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingPoints) {
          await supabase
            .from('user_points')
            .update({
              total_points: existingPoints.total_points + stats.pointsEarned,
              total_distance_meters: existingPoints.total_distance_meters + stats.distanceMeters,
              total_contribution_time_seconds: existingPoints.total_contribution_time_seconds + stats.duration
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

    // Reset stats
    setStats({
      pointsEarned: 0,
      distanceMeters: 0,
      speedKmh: 0,
      signalStrength: 4,
      networkType: '4G',
      duration: 0
    });
    lastPositionRef.current = null;
    setSessionId(null);
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

  return (
    <div className="min-h-screen bg-background px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Network Contribution</h1>
        <p className="text-sm text-muted-foreground">Help map coverage & earn points</p>
      </div>

      {/* Battery Warning */}
      {showBatteryWarning && !isContributing && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Battery className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Battery Optimization</AlertTitle>
          <AlertDescription className="text-amber-200/80">
            For best results, disable battery optimization for Nomiqa in your device settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Control Button */}
      <div className="flex justify-center py-8">
        <button
          onClick={isContributing ? stopContributing : startContributing}
          disabled={!user}
          className={cn(
            'relative w-40 h-40 rounded-full transition-all duration-500',
            'flex items-center justify-center',
            'shadow-2xl transform active:scale-95',
            isContributing 
              ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/50' 
              : 'bg-gradient-to-br from-primary to-primary/70 shadow-primary/50',
            !user && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Pulsing rings when active */}
          {isContributing && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-red-500/20 animate-pulse" />
            </>
          )}
          
          <div className="relative z-10 text-center text-white">
            {isContributing ? (
              <>
                <Pause className="w-12 h-12 mx-auto mb-1" />
                <span className="text-sm font-medium">STOP</span>
              </>
            ) : (
              <>
                <Play className="w-12 h-12 mx-auto mb-1" />
                <span className="text-sm font-medium">START</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Auth prompt */}
      {!user && (
        <div className="text-center text-muted-foreground text-sm">
          Please sign in to start contributing
        </div>
      )}

      {/* Live Stats */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xl font-bold text-foreground">{stats.pointsEarned}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div>
              <Gauge className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-xl font-bold text-foreground">{stats.speedKmh}</div>
              <div className="text-xs text-muted-foreground">km/h</div>
            </div>
            <div>
              <MapPin className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className="text-xl font-bold text-foreground">{formatDistance(stats.distanceMeters)}</div>
              <div className="text-xs text-muted-foreground">Distance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <Signal className={cn(
              'w-5 h-5',
              isOnline ? 'text-green-500' : 'text-red-500'
            )} />
            <div>
              <div className="text-sm font-medium text-foreground capitalize">{connectionType}</div>
              <div className="text-xs text-muted-foreground">Network</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <Wifi className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">{formatDuration(stats.duration)}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200/80">
            You're offline. Data will sync when connected.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
