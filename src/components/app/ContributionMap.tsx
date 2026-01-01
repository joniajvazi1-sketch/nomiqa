import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface ContributionMapProps {
  userPosition: [number, number] | null;
  isActive: boolean;
}

/**
 * Validate coordinates are real GPS values (not 0,0 or invalid)
 */
const isValidCoordinate = (lat: number, lon: number): boolean => {
  // Check for null island (0,0) which often indicates uninitialized GPS
  if (lat === 0 && lon === 0) return false;
  // Check valid ranges
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  // Check for NaN
  if (isNaN(lat) || isNaN(lon)) return false;
  return true;
};

/**
 * Dark-themed interactive map for Network Contribution
 * Uses dynamic import for Leaflet to avoid SSR/initialization issues
 * Includes validation to prevent crashes from invalid coordinates
 */
export const ContributionMap: React.FC<ContributionMapProps> = ({ 
  userPosition, 
  isActive 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null); // Store Leaflet module reference
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validate user position before using
  const validPosition = userPosition && isValidCoordinate(userPosition[0], userPosition[1]) 
    ? userPosition 
    : null;
  
  // Default center (NYC) - used when no valid position
  const defaultCenter: [number, number] = [40.7128, -74.0060];
  const center = validPosition || defaultCenter;

  // Initialize map once
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (!mapRef.current || leafletMapRef.current) return;
      
      try {
        // Dynamic import to avoid initialization issues in Capacitor
        const L = await import('leaflet');
        leafletRef.current = L;
        
        if (!mounted || !mapRef.current) return;
        
        // Create map - NO zoom controls on mobile (pinch to zoom)
        const map = L.map(mapRef.current, {
          center: center,
          zoom: validPosition ? 15 : 3,
          zoomControl: false, // Hide +/- buttons - mobile users pinch to zoom
          scrollWheelZoom: true,
          attributionControl: false
        });
        
        // Add dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);
        
        leafletMapRef.current = map;
        
        // Add marker if valid position exists
        if (validPosition) {
          const pulsingIcon = L.divIcon({
            className: 'pulsing-marker',
            html: `
              <div class="pulse-ring"></div>
              <div class="pulse-dot"></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          markerRef.current = L.marker(validPosition, { icon: pulsingIcon }).addTo(map);
        }
        
        // Fix map size after render - use requestAnimationFrame to avoid state updates during render
        requestAnimationFrame(() => {
          if (!mounted) return;
          map.invalidateSize();
          // Use setTimeout to ensure we're outside the render cycle
          setTimeout(() => {
            if (mounted) {
              setIsLoaded(true);
              setIsMapReady(true);
            }
          }, 50);
        });
        
      } catch (err) {
        console.error('[ContributionMap] Failed to initialize:', err);
        if (mounted) {
          setError('Failed to load map');
          setIsLoaded(true); // Show fallback
        }
      }
    };
    
    initMap();
    
    return () => {
      mounted = false;
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {
          console.warn('[ContributionMap] Cleanup warning:', e);
        }
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);
  
  // Update marker position when userPosition changes - only after map is ready
  useEffect(() => {
    // Don't update if map isn't ready or no valid position
    if (!isMapReady || !leafletMapRef.current || !leafletRef.current) return;
    if (!validPosition) return;
    
    const L = leafletRef.current;
    
    try {
      if (markerRef.current) {
        // Update existing marker position
        markerRef.current.setLatLng(validPosition);
      } else {
        // Create new marker
        const pulsingIcon = L.divIcon({
          className: 'pulsing-marker',
          html: `
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        markerRef.current = L.marker(validPosition, { icon: pulsingIcon }).addTo(leafletMapRef.current);
      }
      
      // Smoothly pan to new position
      leafletMapRef.current.setView(validPosition, 15, { animate: true, duration: 0.5 });
    } catch (err) {
      console.error('[ContributionMap] Failed to update position:', err);
    }
  }, [validPosition?.[0], validPosition?.[1], isMapReady]);

  return (
    <div className="w-full h-full" style={{ minHeight: '100vh' }}>
      {/* Leaflet CSS overrides */}
      <style>{`
        .map-container {
          height: 100% !important;
          width: 100% !important;
          background: hsl(220 35% 8%) !important;
        }
        .pulsing-marker {
          position: relative;
        }
        .pulse-ring {
          position: absolute;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.3);
          animation: pulse-ring 2s ease-out infinite;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .pulse-dot {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid #fff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(20, 20, 20, 0.9) !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(40, 40, 40, 0.9) !important;
        }
      `}</style>
      
      {/* Map container */}
      <div 
        ref={mapRef}
        className="map-container"
        style={{ height: '100vh', width: '100%' }}
      />
      
      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm">{error}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {userPosition ? `Position: ${userPosition[0].toFixed(4)}, ${userPosition[1].toFixed(4)}` : 'Waiting for location...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Loading overlay - shows until map is loaded */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* GPS Acquiring overlay - shows when map loaded but no valid position yet */}
      {isLoaded && !error && !validPosition && isActive && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center bg-background/80 backdrop-blur-sm rounded-2xl p-6 mx-4">
            <div className="relative mx-auto w-12 h-12 mb-3">
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
              <MapPin className="w-12 h-12 text-primary" />
            </div>
            <p className="text-foreground font-medium">Acquiring GPS Signal</p>
            <p className="text-muted-foreground text-sm mt-1">Please wait for location lock...</p>
          </div>
        </div>
      )}
      
      {/* Gradient overlay at bottom - REMOVED to let map extend to true bottom */}
      
      {/* Vignette effect - keep below content overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)'
        }}
      />
    </div>
  );
};