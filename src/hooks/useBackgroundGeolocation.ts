import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Type-only imports
type GeolocationModule = typeof import('@capacitor/geolocation');
type Position = import('@capacitor/geolocation').Position;

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
 * Foreground Geolocation Hook
 * Uses @capacitor/geolocation on native, navigator.geolocation on web
 * Handles location permissions and continuous tracking for Network Contribution
 * Uses dynamic imports to avoid bundling Capacitor geolocation on web
 */
export const useBackgroundGeolocation = (
  onPositionUpdate?: (position: Position) => void,
  options: BackgroundGeolocationOptions = {}
) => {
  const isNative = Capacitor.isNativePlatform();
  const [state, setState] = useState<BackgroundGeolocationState>({
    hasPermission: null,
    isTracking: false,
    lastPosition: null,
    error: null
  });
  
  const watchIdRef = useRef<string | number | null>(null);
  const onPositionUpdateRef = useRef(onPositionUpdate);
  const geoRef = useRef<GeolocationModule | null>(null);
  
  // Keep callback ref updated
  useEffect(() => {
    onPositionUpdateRef.current = onPositionUpdate;
  }, [onPositionUpdate]);

  // Load geolocation module and check permissions on mount
  useEffect(() => {
    const init = async () => {
      if (isNative) {
        try {
          geoRef.current = await import('@capacitor/geolocation');
          await checkPermissions();
        } catch (error) {
          console.warn('Failed to load geolocation module:', error);
        }
      } else {
        await checkPermissions();
      }
    };
    init();
  }, [isNative]);

  const checkPermissions = async (): Promise<boolean> => {
    try {
      if (isNative && geoRef.current) {
        const { Geolocation } = geoRef.current;
        const status = await Geolocation.checkPermissions();
        const granted = status.location === 'granted' || status.coarseLocation === 'granted';
        setState(prev => ({ ...prev, hasPermission: granted }));
        return granted;
      } else {
        // Web: Check using Permissions API if available
        if ('permissions' in navigator) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            const granted = result.state === 'granted';
            setState(prev => ({ ...prev, hasPermission: granted || result.state === 'prompt' }));
            return granted || result.state === 'prompt';
          } catch {
            // Permissions API not supported, assume we can try
            setState(prev => ({ ...prev, hasPermission: true }));
            return true;
          }
        }
        // Assume we can request on web
        setState(prev => ({ ...prev, hasPermission: true }));
        return true;
      }
    } catch (error) {
      console.warn('Permission check failed:', error);
      // Don't set hasPermission to false immediately - let the user try
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (isNative) {
        if (!geoRef.current) {
          geoRef.current = await import('@capacitor/geolocation');
        }
        const { Geolocation } = geoRef.current;
        const status = await Geolocation.requestPermissions();
        const granted = status.location === 'granted' || status.coarseLocation === 'granted';
        setState(prev => ({ ...prev, hasPermission: granted }));
        return granted;
      } else {
        // Web: permissions are requested when watchPosition is called
        // Try getting current position to trigger permission prompt
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setState(prev => ({ ...prev, hasPermission: true }));
              resolve(true);
            },
            (err) => {
              console.error('Web permission denied:', err);
              setState(prev => ({ 
                ...prev, 
                hasPermission: false, 
                error: err.code === 1 ? 'Location permission denied' : 'Location unavailable' 
              }));
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setState(prev => ({ ...prev, hasPermission: false, error: 'Permission denied' }));
      return false;
    }
  };

  /**
   * Validate position has reasonable accuracy (not stale/invalid)
   */
  const isValidPosition = (position: Position): boolean => {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Check for null island (0,0) - often means GPS not locked
    if (latitude === 0 && longitude === 0) {
      console.log('[Geo] Ignoring null island position (0,0)');
      return false;
    }
    
    // Check valid coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.log('[Geo] Invalid coordinate range:', latitude, longitude);
      return false;
    }
    
    // Check for NaN
    if (isNaN(latitude) || isNaN(longitude)) {
      console.log('[Geo] NaN coordinates');
      return false;
    }
    
    // Optionally reject very inaccurate readings (> 500m accuracy)
    if (accuracy && accuracy > 500) {
      console.log('[Geo] Poor accuracy:', accuracy, 'm - still accepting but logging');
    }
    
    return true;
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
    if (watchIdRef.current !== null) {
      return true;
    }

    try {
      if (isNative) {
        if (!geoRef.current) {
          geoRef.current = await import('@capacitor/geolocation');
        }
        const { Geolocation } = geoRef.current;
        
        // Use Capacitor Geolocation
        const watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout ?? 15000,
            maximumAge: options.maximumAge ?? 0
          },
          (position, err) => {
            if (err) {
              console.error('[Geo] Watch position error:', err);
              setState(prev => ({ ...prev, error: err.message }));
              return;
            }
            
            if (position && isValidPosition(position)) {
              setState(prev => ({ ...prev, lastPosition: position, error: null }));
              onPositionUpdateRef.current?.(position);
            }
          }
        );
        
        watchIdRef.current = watchId;
      } else {
        // Use Web Geolocation API
        const watchId = navigator.geolocation.watchPosition(
          (webPosition) => {
            // Convert Web GeolocationPosition to Capacitor Position format
            const position: Position = {
              coords: {
                latitude: webPosition.coords.latitude,
                longitude: webPosition.coords.longitude,
                accuracy: webPosition.coords.accuracy,
                altitude: webPosition.coords.altitude,
                altitudeAccuracy: webPosition.coords.altitudeAccuracy,
                heading: webPosition.coords.heading,
                speed: webPosition.coords.speed
              },
              timestamp: webPosition.timestamp
            };
            
            // Validate before updating state
            if (isValidPosition(position)) {
              setState(prev => ({ ...prev, lastPosition: position, error: null }));
              onPositionUpdateRef.current?.(position);
            }
          },
          (err) => {
            console.error('[Geo] Web watch position error:', err);
            let errorMessage = 'Location error';
            if (err.code === 1) errorMessage = 'Location permission denied';
            else if (err.code === 2) errorMessage = 'Location unavailable';
            else if (err.code === 3) errorMessage = 'Location timeout';
            
            setState(prev => ({ ...prev, error: errorMessage }));
          },
          {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout ?? 15000,
            maximumAge: options.maximumAge ?? 0
          }
        );
        
        watchIdRef.current = watchId;
      }
      
      setState(prev => ({ ...prev, isTracking: true, error: null }));
      return true;
    } catch (error) {
      console.error('[Geo] Start tracking failed:', error);
      setState(prev => ({ 
        ...prev, 
        isTracking: false, 
        error: error instanceof Error ? error.message : 'Failed to start tracking' 
      }));
      return false;
    }
  };

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      try {
        if (isNative && typeof watchIdRef.current === 'string' && geoRef.current) {
          await geoRef.current.Geolocation.clearWatch({ id: watchIdRef.current });
        } else if (!isNative && typeof watchIdRef.current === 'number') {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      } catch (error) {
        console.warn('Clear watch failed:', error);
      }
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  };

  const getCurrentPosition = async (): Promise<Position | null> => {
    try {
      if (isNative) {
        if (!geoRef.current) {
          geoRef.current = await import('@capacitor/geolocation');
        }
        const { Geolocation } = geoRef.current;
        
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          timeout: options.timeout ?? 15000,
          maximumAge: options.maximumAge ?? 0
        });
        setState(prev => ({ ...prev, lastPosition: position }));
        return position;
      } else {
        // Web fallback
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (webPosition) => {
              const position: Position = {
                coords: {
                  latitude: webPosition.coords.latitude,
                  longitude: webPosition.coords.longitude,
                  accuracy: webPosition.coords.accuracy,
                  altitude: webPosition.coords.altitude,
                  altitudeAccuracy: webPosition.coords.altitudeAccuracy,
                  heading: webPosition.coords.heading,
                  speed: webPosition.coords.speed
                },
                timestamp: webPosition.timestamp
              };
              setState(prev => ({ ...prev, lastPosition: position }));
              resolve(position);
            },
            (err) => {
              console.error('Get current position failed:', err);
              resolve(null);
            },
            {
              enableHighAccuracy: options.enableHighAccuracy ?? true,
              timeout: options.timeout ?? 15000,
              maximumAge: options.maximumAge ?? 0
            }
          );
        });
      }
    } catch (error) {
      console.error('Get current position failed:', error);
      return null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        if (isNative && typeof watchIdRef.current === 'string' && geoRef.current) {
          geoRef.current.Geolocation.clearWatch({ id: watchIdRef.current }).catch(console.warn);
        } else if (!isNative && typeof watchIdRef.current === 'number') {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      }
    };
  }, [isNative]);

  return {
    ...state,
    checkPermissions,
    requestPermissions,
    startTracking,
    stopTracking,
    getCurrentPosition
  };
};
