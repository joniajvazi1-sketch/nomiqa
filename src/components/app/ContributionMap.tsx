import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
// This prevents the broken marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom blue pulsing dot icon for user location
const createPulsingIcon = () => {
  return L.divIcon({
    className: 'pulsing-marker',
    html: `
      <div class="pulse-ring"></div>
      <div class="pulse-dot"></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Component to recenter map when position changes
const MapUpdater: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size to fix rendering issues
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15, { animate: true });
    }
  }, [position, map]);
  
  return null;
};

interface ContributionMapProps {
  userPosition: [number, number] | null;
  isActive: boolean;
}

/**
 * Dark-themed interactive map for Network Contribution
 * Uses CartoDB DarkMatter tiles for futuristic look
 */
export const ContributionMap: React.FC<ContributionMapProps> = ({ 
  userPosition, 
  isActive 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Default to a nice view if no position yet
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC
  const center = userPosition || defaultCenter;

  return (
    <div className="absolute inset-0 z-0">
      {/* CSS for pulsing marker and Leaflet overrides */}
      <style>{`
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
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        .leaflet-container {
          background: #0a0a0a !important;
          height: 100% !important;
          width: 100% !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(20, 20, 20, 0.9) !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(40, 40, 40, 0.9) !important;
        }
        .leaflet-tile-pane {
          opacity: 1 !important;
        }
      `}</style>
      
      <MapContainer
        center={center}
        zoom={userPosition ? 15 : 3}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '100vh' }}
        className="rounded-none"
        whenReady={() => setIsLoaded(true)}
      >
        {/* CartoDB Dark Matter - Futuristic dark theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
          maxZoom={19}
        />
        
        {/* Blue dot for user position */}
        {userPosition && (
          <Marker 
            position={userPosition} 
            icon={createPulsingIcon()}
          />
        )}
        
        <MapUpdater position={userPosition} />
      </MapContainer>
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Gradient overlay at bottom for UI blending */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
      }} />
    </div>
  );
};
