import React, { useRef, useEffect, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
// Ensures Mapbox GL's web worker bundles correctly in Vite (prevents blank/black canvas)
// @ts-expect-error - Vite worker import
import MapboxWorker from 'mapbox-gl/dist/mapbox-gl-csp-worker?worker';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GlobalCoverageCell } from '@/hooks/useGlobalCoverage';
import { supabase } from '@/integrations/supabase/client';

(mapboxgl as any).workerClass = MapboxWorker;

interface MapboxGlobeProps {
  coverageData: GlobalCoverageCell[];
  loading?: boolean;
  totalDataPoints?: number;
  uniqueLocations?: number;
  isPersonalView?: boolean;
  userPosition?: [number, number] | null;
}

// Loading fallback
const GlobeLoading: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0f1a] to-[#020408]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm font-medium text-white/60">Loading globe...</span>
    </div>
  </div>
);

// Error fallback
const GlobeErrorFallback: React.FC<{ message?: string }> = ({ message }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0f1a] to-[#020408]">
    <div className="text-center p-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-3xl">🌍</span>
      </div>
      <p className="text-white/70 text-sm">{message || 'Globe temporarily unavailable'}</p>
      <p className="text-white/40 text-xs mt-1">Pull down to refresh</p>
    </div>
  </div>
);

export const MapboxGlobe: React.FC<MapboxGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
  isPersonalView = false,
  userPosition = null,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Calculate real stats
  const realStats = useMemo(() => {
    const uniqueCountries = new Set(coverageData.map(c => `${Math.floor(c.lat / 10)}-${Math.floor(c.lng / 10)}`)).size;
    return {
      dataPoints: totalDataPoints || coverageData.reduce((sum, c) => sum + c.count, 0),
      locations: uniqueLocations || coverageData.length,
      regions: uniqueCountries || Math.min(coverageData.length, 30),
    };
  }, [coverageData, totalDataPoints, uniqueLocations]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setTokenError('No token returned');
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
        setTokenError('Failed to load map configuration');
      }
    };
    fetchToken();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Initial zoom: personal view starts zoomed in, global starts zoomed out
    const initialZoom = isPersonalView ? 4 : 1.5;
    const initialCenter: [number, number] = isPersonalView
      ? (userPosition ?? [30, 15])
      : [30, 15];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark style with country boundaries
      projection: 'globe',
      zoom: initialZoom,
      center: initialCenter,
      pitch: isPersonalView ? 30 : 45,
      bearing: 0,
      antialias: true,
    });

    // Keep the map sized correctly (Mapbox can render blank if initialized at 0x0)
    const ro = new ResizeObserver(() => {
      map.current?.resize();
    });
    ro.observe(mapContainer.current);

    // Surface WebGL/Mapbox errors instead of silently rendering blank
    map.current.on('error', (e) => {
      const msg = (e as any)?.error?.message || (e as any)?.message;
      if (msg) console.error('Mapbox error:', msg);
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'bottom-right'
    );

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      if (!map.current) return;

      // Beautiful atmosphere effect
      map.current.setFog({
        color: 'rgb(10, 15, 26)',
        'high-color': 'rgb(30, 40, 70)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(5, 10, 18)',
        'star-intensity': 0.7,
      });

      // If the map was initialized while transitioning / offscreen, force a resize
      map.current.resize();
    });

    // Consider the map "ready" only when it fully loads
    map.current.on('load', () => {
      if (!map.current) return;
      map.current.resize();
      setMapLoaded(true);
    });

    // Auto-rotate when not interacting (global view only)
    let userInteracting = false;
    const secondsPerRevolution = 180;
    
    function spinGlobe() {
      if (!map.current || isPersonalView) return;
      const zoom = map.current.getZoom();
      if (!userInteracting && zoom < 3) {
        const center = map.current.getCenter();
        center.lng -= 360 / secondsPerRevolution;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', spinGlobe);

    if (!isPersonalView) {
      spinGlobe();
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, isPersonalView, userPosition]);

  // Add coverage data as markers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded || coverageData.length === 0) return;

    // Function to add layers
    const addCoverageLayers = () => {
      if (!map.current) return;
      
      // Double-check style is loaded
      if (!map.current.isStyleLoaded()) {
        // Wait for style to be ready
        map.current.once('style.load', addCoverageLayers);
        return;
      }

      // Remove existing source and layer if they exist
      try {
        if (map.current.getLayer('coverage-heat')) {
          map.current.removeLayer('coverage-heat');
        }
        if (map.current.getLayer('coverage-points')) {
          map.current.removeLayer('coverage-points');
        }
        if (map.current.getSource('coverage-data')) {
          map.current.removeSource('coverage-data');
        }
      } catch (e) {
        console.log('Cleanup error (safe to ignore):', e);
      }

      // Convert coverage data to GeoJSON
      const maxCount = Math.max(...coverageData.map(c => c.count), 1);
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: coverageData.slice(0, 300).map(cell => ({
          type: 'Feature',
          properties: {
            count: cell.count,
            intensity: cell.count / maxCount,
          },
          geometry: {
            type: 'Point',
            coordinates: [cell.lng, cell.lat],
          },
        })),
      };

      // Add source
      map.current.addSource('coverage-data', {
        type: 'geojson',
        data: geojsonData,
      });

      // Add heatmap layer for zoomed-out view
      map.current.addLayer({
        id: 'coverage-heat',
        type: 'heatmap',
        source: 'coverage-data',
        maxzoom: 9,
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.2, 'rgba(168, 85, 247, 0.4)',
            0.4, 'rgba(6, 182, 212, 0.6)',
            0.6, 'rgba(34, 197, 94, 0.8)',
            1, 'rgba(34, 197, 94, 1)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 9, 30],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
        },
      });

      // Add circle markers for zoomed-in view
      map.current.addLayer({
        id: 'coverage-points',
        type: 'circle',
        source: 'coverage-data',
        minzoom: 5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 15, 12],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, '#a855f7',
            0.4, '#06b6d4',
            0.7, '#22c55e',
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1,
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 0.9],
        },
      });

      // Add popup on click
      map.current.on('click', 'coverage-points', (e) => {
        if (!e.features?.[0]) return;
        const coordinates = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const count = e.features[0].properties?.count || 0;

        new mapboxgl.Popup({ closeButton: false, className: 'coverage-popup' })
          .setLngLat(coordinates)
          .setHTML(`
            <div class="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2">
              <p class="text-gray-900 font-bold text-xs">${coordinates[1].toFixed(2)}°, ${coordinates[0].toFixed(2)}°</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-cyan-600 text-sm font-bold">${count}</span>
                <span class="text-gray-500 text-[10px]">data points</span>
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'coverage-points', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'coverage-points', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    };

    // Call the function
    addCoverageLayers();

  }, [mapLoaded, coverageData]);

  // Handle view changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    if (isPersonalView && userPosition) {
      map.current.flyTo({
        center: userPosition,
        zoom: 6,
        pitch: 30,
        duration: 2000,
      });
    } else if (!isPersonalView) {
      map.current.flyTo({
        center: [30, 15],
        zoom: 1.5,
        pitch: 45,
        duration: 2000,
      });
    }
  }, [isPersonalView, userPosition, mapLoaded]);

  if (tokenError) {
    return <GlobeErrorFallback message={tokenError} />;
  }

  if (!mapboxToken) {
    return <GlobeLoading />;
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0a0f1a] via-[#050a12] to-[#020408] overflow-hidden">
      {/* Top stats bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
            </div>
            <span className="text-green-500 text-sm font-bold tracking-wide">LIVE</span>
          </div>
          <span className="text-white/40 text-xs">Community Coverage Map</span>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-white/60 text-[10px] font-medium">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-white/60 text-[10px] font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-white/60 text-[10px] font-medium">New</span>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.dataPoints.toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Samples</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.locations.toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Cities</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.regions}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Regions</div>
          </div>
        </div>
      </div>

      {/* Mapbox Globe Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading overlay */}
      {(loading || !mapLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020408]/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary text-sm font-medium">Loading network data...</span>
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020408] to-transparent z-10 pointer-events-none" />

      {/* Custom popup styles */}
      <style>{`
        .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .mapboxgl-popup-tip {
          display: none !important;
        }
        .mapboxgl-ctrl-group {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-ctrl-group button {
          background-color: transparent !important;
        }
        .mapboxgl-ctrl-group button:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-ctrl-group button span {
          filter: invert(1) !important;
        }
      `}</style>
    </div>
  );
};

export default MapboxGlobe;
