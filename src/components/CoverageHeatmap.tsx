import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// @ts-ignore - leaflet.heat doesn't have types
import 'leaflet.heat';

interface CoverageCell {
  lat: number;
  lng: number;
  intensity: number;
  network: string;
  count: number;
}

interface CoverageHeatmapProps {
  cells: CoverageCell[];
  height?: string;
  className?: string;
}

/**
 * Real Leaflet heatmap for coverage visualization.
 * Uses leaflet.heat for GPU-accelerated rendering.
 */
export const CoverageHeatmap = memo(({ cells, height = '500px', className = '' }: CoverageHeatmapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map with dark theme tiles
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 14,
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Dark-themed tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add subtle attribution
    L.control.attribution({ position: 'bottomright', prefix: '' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update heatmap data when cells change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !cells.length) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Convert cells to heatmap points [lat, lng, intensity]
    const heatPoints: [number, number, number][] = cells.map(cell => [
      cell.lat,
      cell.lng,
      // Scale intensity by data density
      Math.min(1, (cell.intensity * 0.6) + (Math.min(cell.count, 100) / 100 * 0.4)),
    ]);

    // Create heat layer with telecom-themed gradient
    // @ts-ignore
    const heat = L.heatLayer(heatPoints, {
      radius: 20,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      minOpacity: 0.3,
      gradient: {
        0.0: '#1a1a2e',   // dark base
        0.2: '#16213e',   // deep blue
        0.4: '#0f3460',   // medium blue
        0.5: '#00d4ff',   // cyan (LTE)
        0.7: '#00ff88',   // green (good signal)
        0.85: '#ffaa00',  // amber (medium)
        1.0: '#ff3366',   // coral (hot/dense)
      },
    });

    heat.addTo(map);
    heatLayerRef.current = heat;

    // Auto-fit bounds if we have data
    if (heatPoints.length > 5) {
      const bounds = L.latLngBounds(heatPoints.map(p => [p[0], p[1]] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }, [cells]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border/30 ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" style={{ background: 'hsl(var(--card))' }} />
      
      {/* Overlay legend */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-4 px-4 py-2.5 rounded-xl bg-card/90 backdrop-blur-sm border border-border/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
          <span>LTE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
          <span>Strong</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ff3366', boxShadow: '0 0 6px #ff3366' }} />
          <span>Dense</span>
        </div>
      </div>

      {/* Live badge */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-neon-cyan/20">
        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
        <span className="text-xs font-medium text-neon-cyan">Live Coverage</span>
      </div>

      {/* No data state */}
      {cells.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-card/60 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-neon-cyan/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Coverage data loading...</p>
          </div>
        </div>
      )}
    </div>
  );
});

CoverageHeatmap.displayName = 'CoverageHeatmap';
