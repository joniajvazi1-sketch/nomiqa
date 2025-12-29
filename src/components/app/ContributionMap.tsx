import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const mapRef = useRef<any>(null);
  
  // Default to a nice view if no position yet
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC
  const center = userPosition || defaultCenter;

  return (
    <div className="absolute inset-0 z-0">
      {/* CSS for pulsing marker */}
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
      `}</style>
      
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={userPosition ? 15 : 3}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-none"
      >
        {/* CartoDB Dark Matter - Futuristic dark theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
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
      
      {/* Gradient overlay at bottom for UI blending */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
      }} />
    </div>
  );
};
