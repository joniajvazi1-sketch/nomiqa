import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Loader2, Layers, Map as MapIcon } from 'lucide-react';
import { HeatmapPoint } from '@/hooks/useContributionHeatmap';
import { cn } from '@/lib/utils';

// Lazy load Leaflet CSS only when this component is used
let leafletCssLoaded = false;
const loadLeafletCss = () => {
  if (leafletCssLoaded || typeof document === 'undefined') return;
  leafletCssLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
};

interface ContributionMapProps {
  userPosition: [number, number] | null;
  isActive: boolean;
  heatmapPoints?: HeatmapPoint[];
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
}

/**
 * Validate coordinates are real GPS values (not 0,0 or invalid)
 */
const isValidCoordinate = (lat: number, lon: number): boolean => {
  if (lat === 0 && lon === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  return true;
};

/**
 * Dark-themed interactive map for Network Contribution
 * Supports heatmap overlay for coverage visualization
 */
export const ContributionMap: React.FC<ContributionMapProps> = ({ 
  userPosition, 
  isActive,
  heatmapPoints = [],
  showHeatmap = false,
  onToggleHeatmap
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const validPosition = userPosition && isValidCoordinate(userPosition[0], userPosition[1]) 
    ? userPosition 
    : null;
  
  const defaultCenter: [number, number] = [40.7128, -74.0060];
  const center = validPosition || defaultCenter;

  // Initialize map once
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (!mapRef.current || leafletMapRef.current) return;
      
      try {
        // Load Leaflet CSS dynamically
        loadLeafletCss();
        
        const L = await import('leaflet');
        leafletRef.current = L;
        
        // Dynamic import of leaflet.heat
        await import('leaflet.heat');
        
        if (!mounted || !mapRef.current) return;
        
        const map = L.map(mapRef.current, {
          center: center,
          zoom: validPosition ? 15 : 3,
          zoomControl: false,
          scrollWheelZoom: true,
          attributionControl: false
        });
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);
        
        leafletMapRef.current = map;
        
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
        
        requestAnimationFrame(() => {
          if (!mounted) return;
          map.invalidateSize();
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
          setIsLoaded(true);
        }
      }
    };
    
    initMap();
    
    return () => {
      mounted = false;
      if (heatLayerRef.current && leafletMapRef.current) {
        try {
          leafletMapRef.current.removeLayer(heatLayerRef.current);
        } catch (e) {}
        heatLayerRef.current = null;
      }
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
  
  // Update marker position
  useEffect(() => {
    if (!isMapReady || !leafletMapRef.current || !leafletRef.current) return;
    if (!validPosition) return;
    
    const L = leafletRef.current;
    
    try {
      if (markerRef.current) {
        markerRef.current.setLatLng(validPosition);
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
        markerRef.current = L.marker(validPosition, { icon: pulsingIcon }).addTo(leafletMapRef.current);
      }
      
      leafletMapRef.current.setView(validPosition, 15, { animate: true, duration: 0.5 });
    } catch (err) {
      console.error('[ContributionMap] Failed to update position:', err);
    }
  }, [validPosition?.[0], validPosition?.[1], isMapReady]);

  // Update heatmap layer when points change or toggle
  useEffect(() => {
    if (!isMapReady || !leafletMapRef.current || !leafletRef.current) return;
    
    const L = leafletRef.current;
    const map = leafletMapRef.current;
    
    // Remove existing heatmap
    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current);
      } catch (e) {}
      heatLayerRef.current = null;
    }
    
    // Add heatmap if enabled and has points
    if (showHeatmap && heatmapPoints.length > 0 && (L as any).heatLayer) {
      try {
        // Convert points to [lat, lng, intensity] format
        const heatData = heatmapPoints.map(p => [p.lat, p.lng, p.intensity]);
        
        heatLayerRef.current = (L as any).heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.4,
          gradient: {
            0.0: '#0D0D1A',    // Deep space
            0.25: '#6366f1',   // Indigo (weak signal)
            0.5: '#22d3ee',    // Cyan (medium signal)
            0.75: '#10b981',   // Emerald (good signal)
            1.0: '#f59e0b'     // Amber (excellent signal)
          }
        }).addTo(map);
        
        // Fit map to heatmap bounds if we have points
        if (heatmapPoints.length > 1) {
          const lats = heatmapPoints.map(p => p.lat);
          const lngs = heatmapPoints.map(p => p.lng);
          const bounds = L.latLngBounds(
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
          );
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch (err) {
        console.error('[ContributionMap] Failed to create heatmap:', err);
      }
    }
  }, [showHeatmap, heatmapPoints, isMapReady]);

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
      `}</style>
      
      {/* Map container */}
      <div 
        ref={mapRef}
        className="map-container"
        style={{ height: '100vh', width: '100%' }}
      />
      
      {/* Toggle button for heatmap view */}
      {onToggleHeatmap && isLoaded && !error && (
        <button
          onClick={onToggleHeatmap}
          className={cn(
            'absolute top-4 right-4 z-20',
            'w-12 h-12 rounded-full',
            'backdrop-blur-xl border shadow-lg',
            'flex items-center justify-center',
            'transition-all active:scale-95',
            showHeatmap 
              ? 'bg-neon-cyan/20 border-neon-cyan/50 shadow-neon-cyan/20'
              : 'bg-white/10 border-white/20'
          )}
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
        >
          {showHeatmap ? (
            <MapIcon className="w-5 h-5 text-neon-cyan" />
          ) : (
            <Layers className="w-5 h-5 text-foreground" />
          )}
        </button>
      )}
      
      {/* Heatmap legend */}
      {showHeatmap && heatmapPoints.length > 0 && isLoaded && (
        <div 
          className="absolute bottom-24 left-4 right-4 z-20 pointer-events-none animate-fade-in"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="bg-background/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Signal Strength</span>
              <span className="text-xs font-medium text-foreground">{heatmapPoints.length} data points</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{
              background: 'linear-gradient(to right, #6366f1, #22d3ee, #10b981, #f59e0b)'
            }} />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Weak</span>
              <span className="text-[10px] text-muted-foreground">Excellent</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* GPS Acquiring overlay */}
      {isLoaded && !error && !validPosition && isActive && !showHeatmap && (
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
      
      {/* Empty heatmap state */}
      {showHeatmap && heatmapPoints.length === 0 && isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center bg-background/80 backdrop-blur-sm rounded-2xl p-6 mx-4">
            <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-foreground font-medium">No Coverage Data Yet</p>
            <p className="text-muted-foreground text-sm mt-1">Start scanning to build your coverage map</p>
          </div>
        </div>
      )}
      
      {/* Vignette effect */}
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