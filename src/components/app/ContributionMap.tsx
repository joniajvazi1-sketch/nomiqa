import React, { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface ContributionMapProps {
  userPosition: [number, number] | null;
  isActive: boolean;
}

/**
 * Dark-themed interactive map for Network Contribution
 * Uses dynamic import for Leaflet to avoid SSR/initialization issues
 */
export const ContributionMap: React.FC<ContributionMapProps> = ({ 
  userPosition, 
  isActive 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default center
  const defaultCenter: [number, number] = [40.7128, -74.0060];
  const center = userPosition || defaultCenter;

  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (!mapRef.current || leafletMapRef.current) return;
      
      try {
        // Dynamic import to avoid initialization issues
        const L = await import('leaflet');
        
        if (!mounted || !mapRef.current) return;
        
        // Create map
        const map = L.map(mapRef.current, {
          center: center,
          zoom: userPosition ? 15 : 3,
          zoomControl: true,
          scrollWheelZoom: true,
          attributionControl: false
        });
        
        // Add dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);
        
        leafletMapRef.current = map;
        
        // Add marker if position exists
        if (userPosition) {
          const pulsingIcon = L.divIcon({
            className: 'pulsing-marker',
            html: `
              <div class="pulse-ring"></div>
              <div class="pulse-dot"></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          markerRef.current = L.marker(userPosition, { icon: pulsingIcon }).addTo(map);
        }
        
        // Fix map size after render
        setTimeout(() => {
          map.invalidateSize();
          if (mounted) setIsLoaded(true);
        }, 100);
        
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
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);
  
  // Update marker position when userPosition changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    
    const L = require('leaflet');
    
    if (userPosition) {
      if (markerRef.current) {
        markerRef.current.setLatLng(userPosition);
      } else {
        const pulsingIcon = L.divIcon({
          className: 'pulsing-marker',
          html: `
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        markerRef.current = L.marker(userPosition, { icon: pulsingIcon }).addTo(leafletMapRef.current);
      }
      leafletMapRef.current.setView(userPosition, 15, { animate: true });
    }
  }, [userPosition]);

  return (
    <div className="fixed inset-0" style={{ zIndex: 0, height: '100vh', width: '100vw' }}>
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
      
      {/* Loading overlay */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Gradient overlay at bottom - REMOVED to let map extend to true bottom */}
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 5,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)'
        }}
      />
    </div>
  );
};