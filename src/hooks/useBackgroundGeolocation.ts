import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { usePlatform } from './usePlatform';

interface BackgroundGeolocationState {
  hasPermission: boolean | null;
  isTracking: boolean;
  lastPosition: Position | null;
  error: string | null;
}

interface BackgroundGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Background Geolocation Hook
 * Handles location permissions and continuous tracking for Network Contribution
 */
export const useBackgroundGeolocation = (
  onPositionUpdate?: (position: Position) => void,
  options: BackgroundGeolocationOptions = {}
) => {
  const { isNative } = usePlatform();
  const [state, setState] = useState<BackgroundGeolocationState>({
    hasPermission: null,
    isTracking: false,
    lastPosition: null,
    error: null
  });
  
  const watchIdRef = useRef<string | null>(null);
  const onPositionUpdateRef = useRef(onPositionUpdate);
  
  // Keep callback ref updated
  useEffect(() => {
    onPositionUpdateRef.current = onPositionUpdate;
  }, [onPositionUpdate]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async (): Promise<boolean> => {
    try {
      const status: PermissionStatus = await Geolocation.checkPermissions();
      const granted = status.location === 'granted' || status.coarseLocation === 'granted';
      setState(prev => ({ ...prev, hasPermission: granted }));
      return granted;
    } catch (error) {
      console.warn('Permission check failed:', error);
      setState(prev => ({ ...prev, hasPermission: false, error: 'Permission check failed' }));
      return false;
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const status = await Geolocation.requestPermissions();
      const granted = status.location === 'granted' || status.coarseLocation === 'granted';
      setState(prev => ({ ...prev, hasPermission: granted }));
      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      setState(prev => ({ ...prev, hasPermission: false, error: 'Permission denied' }));
      return false;
    }
  };

  const startTracking = async (): Promise<boolean> => {
    // Check/request permissions first
    let hasPermission = state.hasPermission;
    if (!hasPermission) {
      hasPermission = await requestPermissions();
      if (!hasPermission) {
        return false;
      }
    }

    // Already tracking
    if (watchIdRef.current) {
      return true;
    }

    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 0
        },
        (position, err) => {
          if (err) {
            console.error('Watch position error:', err);
            setState(prev => ({ ...prev, error: err.message }));
            return;
          }
          
          if (position) {
            setState(prev => ({ ...prev, lastPosition: position, error: null }));
            onPositionUpdateRef.current?.(position);
          }
        }
      );
      
      watchIdRef.current = watchId;
      setState(prev => ({ ...prev, isTracking: true, error: null }));
      return true;
    } catch (error) {
      console.error('Start tracking failed:', error);
      setState(prev => ({ 
        ...prev, 
        isTracking: false, 
        error: error instanceof Error ? error.message : 'Failed to start tracking' 
      }));
      return false;
    }
  };

  const stopTracking = async () => {
    if (watchIdRef.current) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      } catch (error) {
        console.warn('Clear watch failed:', error);
      }
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  };

  const getCurrentPosition = async (): Promise<Position | null> => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 0
      });
      setState(prev => ({ ...prev, lastPosition: position }));
      return position;
    } catch (error) {
      console.error('Get current position failed:', error);
      return null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current }).catch(console.warn);
      }
    };
  }, []);

  return {
    ...state,
    checkPermissions,
    requestPermissions,
    startTracking,
    stopTracking,
    getCurrentPosition
  };
};
