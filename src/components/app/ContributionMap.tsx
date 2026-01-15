import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Loader2, Layers, Map as MapIcon, Globe2, User } from 'lucide-react';
import { HeatmapPoint } from '@/hooks/useContributionHeatmap';
import { GlobalCoverageCell } from '@/hooks/useGlobalCoverage';
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

// Network type colors for global coverage
const NETWORK_COLORS = {
  '5g': '#22d3ee',    // Cyan
  'lte': '#3b82f6',   // Blue
  '3g': '#eab308',    // Yellow
  'other': '#6b7280', // Gray
};

type CoverageMode = 'personal' | 'global';

interface ContributionMapProps {
  userPosition: [number, number] | null;
  isActive: boolean;
  heatmapPoints?: HeatmapPoint[];
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
  // Global coverage props
  globalCoverage?: GlobalCoverageCell[];
  coverageMode?: CoverageMode;
  onToggleCoverageMode?: () => void;
  globalCoverageLoading?: boolean;
  networkFilter?: '5g' | 'lte' | '3g' | null;
  onNetworkFilterChange?: (filter: '5g' | 'lte' | '3g' | null) => void;
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
 * Supports personal heatmap and global community coverage
 */
export const ContributionMap: React.FC<ContributionMapProps> = ({ 
  userPosition, 
  isActive,
  heatmapPoints = [],
  showHeatmap = false,
  onToggleHeatmap,
  globalCoverage = [],
  coverageMode = 'personal',
  onToggleCoverageMode,
  globalCoverageLoading = false,
  networkFilter = null,
  onNetworkFilterChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const globalMarkersRef = useRef<any[]>([]);
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
      // Clean up global markers
      globalMarkersRef.current.forEach(marker => {
        try { leafletMapRef.current?.removeLayer(marker); } catch (e) {}
      });
      globalMarkersRef.current = [];
      
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

  // Update heatmap layer when points change or toggle (personal mode only)
  useEffect(() => {
    if (!isMapReady || !leafletMapRef.current || !leafletRef.current) return;
    if (coverageMode !== 'personal') return; // Skip for global mode
    
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
  }, [showHeatmap, heatmapPoints, isMapReady, coverageMode]);

  // Render global coverage markers
  useEffect(() => {
    if (!isMapReady || !leafletMapRef.current || !leafletRef.current) return;
    if (coverageMode !== 'global') return;

    const L = leafletRef.current;
    const map = leafletMapRef.current;

    // Clear existing markers
    globalMarkersRef.current.forEach(marker => {
      try { map.removeLayer(marker); } catch (e) {}
    });
    globalMarkersRef.current = [];

    // Remove personal heatmap if visible
    if (heatLayerRef.current) {
      try { map.removeLayer(heatLayerRef.current); } catch (e) {}
      heatLayerRef.current = null;
    }

    if (globalCoverage.length === 0) return;

    // Filter by network type if specified
    const filteredCells = networkFilter 
      ? globalCoverage.filter(cell => cell.network === networkFilter)
      : globalCoverage;

    // Create circle markers for each cell
    filteredCells.forEach(cell => {
      const color = NETWORK_COLORS[cell.network] || NETWORK_COLORS.other;
      const radius = Math.max(300, Math.min(1000, cell.count * 50)); // 300-1000m based on data points
      const opacity = 0.3 + (cell.intensity * 0.5); // 0.3-0.8 based on signal strength

      const circle = L.circle([cell.lat, cell.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: opacity,
        weight: 1,
        opacity: 0.6,
      }).addTo(map);

      // Add popup with info
      circle.bindPopup(`
        <div style="font-family: monospace; font-size: 12px;">
          <strong>${cell.network.toUpperCase()}</strong><br/>
          Signal: ${Math.round(cell.intensity * 100)}%<br/>
          Data points: ${cell.count}
        </div>
      `);

      globalMarkersRef.current.push(circle);
    });

    // Fit bounds to global coverage
    if (filteredCells.length > 1) {
      const lats = filteredCells.map(c => c.lat);
      const lngs = filteredCells.map(c => c.lng);
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    console.log(`[ContributionMap] Rendered ${filteredCells.length} global coverage cells`);
  }, [globalCoverage, coverageMode, networkFilter, isMapReady]);

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
      
      {/* Heatmap toggle (personal mode only) - single icon button top-right */}
      {onToggleHeatmap && coverageMode === 'personal' && isLoaded && !error && (
        <button
          onClick={onToggleHeatmap}
          className={cn(
            'absolute top-4 right-4 z-20',
            'w-12 h-12 rounded-2xl',
            'backdrop-blur-2xl border shadow-xl',
            'flex items-center justify-center',
            'transition-all active:scale-95',
            showHeatmap 
              ? 'bg-primary/20 border-primary/40'
              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]'
          )}
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
        >
          {showHeatmap ? (
            <MapIcon className="w-5 h-5 text-primary" />
          ) : (
            <Layers className="w-5 h-5 text-foreground" />
          )}
        </button>
      )}

      {/* Network type filter (global mode only) */}
      {coverageMode === 'global' && onNetworkFilterChange && isLoaded && !error && (
        <div 
          className="absolute top-20 left-4 right-4 z-20 flex items-center justify-center"
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-xl">
            {(['5g', 'lte', '3g', null] as const).map((filter) => (
              <button
                key={filter || 'all'}
                onClick={() => onNetworkFilterChange(filter)}
                className={cn(
                  'px-4 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all active:scale-95',
                  networkFilter === filter
                    ? 'text-black shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                )}
                style={networkFilter === filter ? {
                  backgroundColor: filter ? NETWORK_COLORS[filter] : '#10b981',
                  boxShadow: `0 4px 15px ${filter ? NETWORK_COLORS[filter] : '#10b981'}40`,
                } : undefined}
              >
                {filter ? filter.toUpperCase() : 'All'}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Legends removed - they overlap with NetworkContribution bottom controls */}
      
      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center p-8 mx-4 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Map Error</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center p-8 mx-4 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Loading Map</p>
            <p className="text-muted-foreground text-sm">Initializing coverage view...</p>
          </div>
        </div>
      )}

      {/* Global coverage loading overlay */}
      {globalCoverageLoading && coverageMode === 'global' && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 mx-4 border border-white/[0.08] shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neon-cyan/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Loading Global Coverage</p>
            <p className="text-sm text-muted-foreground">Aggregating community data...</p>
          </div>
        </div>
      )}
      
      {/* GPS Acquiring overlay - styled to match premium glassmorphism */}
      {isLoaded && !error && !validPosition && isActive && coverageMode === 'personal' && !showHeatmap && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 mx-4 border border-white/[0.08] shadow-2xl">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Acquiring GPS Signal</p>
            <p className="text-sm text-muted-foreground">Please wait for location lock...</p>
          </div>
        </div>
      )}
      
      {/* Empty heatmap state (personal) */}
      {coverageMode === 'personal' && showHeatmap && heatmapPoints.length === 0 && isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 mx-4 border border-white/[0.08] shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] flex items-center justify-center">
              <Layers className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">No Coverage Data Yet</p>
            <p className="text-sm text-muted-foreground">Start scanning to build your coverage map</p>
          </div>
        </div>
      )}

      {/* Empty global coverage state */}
      {coverageMode === 'global' && globalCoverage.length === 0 && !globalCoverageLoading && isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 mx-4 border border-white/[0.08] shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neon-cyan/10 flex items-center justify-center">
              <Globe2 className="w-8 h-8 text-neon-cyan" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">No Global Coverage Yet</p>
            <p className="text-sm text-muted-foreground">Be the first to contribute!</p>
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