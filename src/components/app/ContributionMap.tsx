import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

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

// Component to recenter map when position changes and handle size issues
const MapController: React.FC<{ 
  position: [number, number] | null;
  onReady: () => void;
}> = ({ position, onReady }) => {
  const map = useMap();
  
  useEffect(() => {
    // Immediately notify ready
    onReady();
    
    // Invalidate size multiple times to fix container issues
    const invalidate = () => map.invalidateSize();
    invalidate();
    const t1 = setTimeout(invalidate, 250);
    const t2 = setTimeout(invalidate, 500);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, onReady]);
  
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
 * Uses CartoDB Dark Matter tiles
 */
export const ContributionMap: React.FC<ContributionMapProps> = ({ 
  userPosition, 
  isActive 
}) => {
  const [isReady, setIsReady] = useState(false);
  
  // Default to a nice view if no position yet
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC
  const center = userPosition || defaultCenter;

  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  return (
    <div 
      className="absolute inset-0" 
      style={{ zIndex: 0 }}
    >
      {/* Leaflet CSS overrides and pulsing marker styles */}
      <style>{`
        .contribution-map-container {
          height: 100vh !important;
          width: 100% !important;
          background: #1a1a2e !important;
        }
        .contribution-map-container .leaflet-tile-pane {
          z-index: 1 !important;
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
      
      <MapContainer
        center={center}
        zoom={userPosition ? 15 : 3}
        zoomControl={true}
        scrollWheelZoom={true}
        className="contribution-map-container"
        style={{ height: '100vh', width: '100%' }}
      >
        {/* OpenStreetMap tiles for better visibility */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
        
        <MapController position={userPosition} onReady={handleReady} />
      </MapContainer>
      
      {/* Loading overlay - hidden once ready */}
      {!isReady && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-background"
          style={{ zIndex: 30 }}
        >
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Gradient overlay at bottom for UI blending */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"
        style={{ zIndex: 5 }}
      />
      
      {/* Subtle vignette effect */}
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