import React, { useRef, useMemo, Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { GlobalCoverageCell } from '@/hooks/useGlobalCoverage';

interface NetworkGlobeProps {
  coverageData: GlobalCoverageCell[];
  loading?: boolean;
  totalDataPoints?: number;
  uniqueLocations?: number;
  allTimeCities?: number;
  coverageAreaKm2?: number;
  totalContributors?: number;
  isPersonalView?: boolean;
  userPosition?: [number, number] | null;
}

// Convert lat/lng to 3D sphere coordinates
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

const getSurfaceNormal = (lat: number, lng: number): THREE.Vector3 => {
  return latLngToVector3(lat, lng, 1).normalize();
};

// Quality tier helpers
const getQualityTier = (intensity: number): 'strong' | 'medium' | 'weak' => {
  if (intensity > 0.6) return 'strong';
  if (intensity > 0.3) return 'medium';
  return 'weak';
};

// Format numbers: round up slowly as they grow (27468 → "27k", 391 → "390+", 19771 → "19k")
const formatStatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 10000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 100) return `${Math.round(value / 10) * 10}+`;
  return value.toString();
};

const QUALITY_COLORS = {
  strong: { base: 'hsl(142 72% 45%)', glow: 'hsl(142 90% 70%)' },
  medium: { base: 'hsl(38 92% 50%)', glow: 'hsl(43 96% 62%)' },
  weak: { base: 'hsl(0 84% 60%)', glow: 'hsl(0 92% 73%)' },
} as const;

interface TileData {
  lat: number;
  lng: number;
  count: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  quality: 'strong' | 'medium' | 'weak';
  networkType: string;
  avgSignalLabel: string;
  tileSize: number;
}

// Prepare tile data from coverage cells (pure computation, no React)
const prepareTiles = (cells: GlobalCoverageCell[]): TileData[] => {
  if (!cells || cells.length === 0) return [];

  return cells.slice(0, 500).map(cell => {
    // Use actual signal intensity from edge function instead of relative count
    const signalIntensity = typeof cell.intensity === 'number' ? cell.intensity : 0.5;
    const quality = getQualityTier(signalIntensity);
    const networkLabel = cell.network === '5g' ? '5G' :
      cell.network === 'lte' ? 'LTE' :
      cell.network === '3g' ? '3G' : 'Mixed';
    const tileSize = Math.min(0.05 + (cell.count / 100) * 0.02, 0.12);

    return {
      lat: cell.lat,
      lng: cell.lng,
      count: cell.count,
      position: latLngToVector3(cell.lat, cell.lng, 1.535),
      normal: getSurfaceNormal(cell.lat, cell.lng),
      quality,
      networkType: networkLabel,
      avgSignalLabel: quality === 'strong' ? 'Strong' : quality === 'medium' ? 'Medium' : 'Weak',
      tileSize,
    };
  });
};

// InstancedMesh-based coverage tiles — 2 draw calls total
const InstancedCoverageTiles: React.FC<{
  tiles: TileData[];
  selectedIndex: number | null;
  onSelectIndex: (idx: number | null) => void;
}> = ({ tiles, selectedIndex, onSelectIndex }) => {
  const discRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  // Shared geometries
  const discGeo = useMemo(() => new THREE.CircleGeometry(1, 16), []);
  const ringGeo = useMemo(() => new THREE.RingGeometry(1, 1.6, 16), []);

  // Update instance matrices and colors whenever tiles change
  useEffect(() => {
    if (!discRef.current || !glowRef.current || tiles.length === 0) return;

    const tempMatrix = new THREE.Matrix4();
    const tempQuat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    const tempColor = new THREE.Color();

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      tempQuat.setFromUnitVectors(up, t.normal);
      const scale = i === selectedIndex ? t.tileSize * 1.6 : t.tileSize;

      tempMatrix.compose(t.position, tempQuat, new THREE.Vector3(scale, scale, 1));
      discRef.current.setMatrixAt(i, tempMatrix);
      glowRef.current.setMatrixAt(i, tempMatrix);

      const colors = QUALITY_COLORS[t.quality];
      discRef.current.setColorAt(i, tempColor.copy(colors.base));
      glowRef.current.setColorAt(i, tempColor.copy(colors.glow));
    }

    discRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
    if (discRef.current.instanceColor) discRef.current.instanceColor.needsUpdate = true;
    if (glowRef.current.instanceColor) glowRef.current.instanceColor.needsUpdate = true;
  }, [tiles, selectedIndex]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      onSelectIndex(e.instanceId === selectedIndex ? null : e.instanceId);
    }
  }, [selectedIndex, onSelectIndex]);

  const count = tiles.length;
  if (count === 0) return null;

  const selectedTile = selectedIndex !== null ? tiles[selectedIndex] : null;

  return (
    <>
      {/* Disc instances — use emissive so tiles glow bright, not black */}
      <instancedMesh
        ref={discRef}
        args={[discGeo, undefined, count]}
        onClick={handleClick}
      >
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          vertexColors
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Glow ring instances */}
      <instancedMesh
        ref={glowRef}
        args={[ringGeo, undefined, count]}
      >
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.55}
          vertexColors
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Tooltip for selected tile */}
      {selectedTile && (
        <group position={selectedTile.position}>
          <Html center distanceFactor={2.5} zIndexRange={[100, 0]} style={{ pointerEvents: 'auto' }}>
            <div
              className="relative bg-card border border-border rounded-lg px-3 py-2.5 min-w-[140px] max-w-[200px] shadow-xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onSelectIndex(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center text-[9px] font-bold leading-none shadow-md"
                aria-label="Close"
              >
                ✕
              </button>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Coverage Tile</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">Signal</span>
                  <span className={`text-xs font-bold ${
                    selectedTile.quality === 'strong' ? 'text-green-500' :
                    selectedTile.quality === 'medium' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {selectedTile.avgSignalLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">Samples</span>
                  <span className="text-foreground text-xs font-bold">{selectedTile.count.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">Network</span>
                  <span className="text-foreground text-xs font-semibold">{selectedTile.networkType}</span>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}
    </>
  );
};

// Earth with children rendered inside the same rotating group
const Earth: React.FC<{ isDark?: boolean; children?: React.ReactNode }> = ({ isDark = true, children }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const initializedRef = useRef(false);

  const dayTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg');
  const bumpTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
  const specularTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png');
  const nightTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg');

  [dayTexture, bumpTexture, specularTexture, nightTexture].forEach(tex => {
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });

  useFrame(() => {
    if (groupRef.current) {
      // Set initial rotation to face Europe/Africa where most data is
      if (!initializedRef.current) {
        // Rotate to show ~10°E longitude (Europe) facing camera
        groupRef.current.rotation.y = -0.18; // ~10° east in radians
        initializedRef.current = true;
      }
      groupRef.current.rotation.y += 0.0003;
    }
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.00015;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.5, 128, 128]} />
        <meshPhongMaterial
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.015}
          specularMap={specularTexture}
          specular={new THREE.Color(isDark ? 0x333333 : 0x666666)}
          shininess={isDark ? 25 : 40}
        />
      </mesh>
      {isDark && (
        <mesh>
          <sphereGeometry args={[1.501, 128, 128]} />
          <meshBasicMaterial map={nightTexture} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.52, 64, 64]} />
        <meshPhongMaterial color="#ffffff" transparent opacity={isDark ? 0.08 : 0.18} depthWrite={false} />
      </mesh>
      <Sphere args={[1.55, 64, 64]}>
        <meshBasicMaterial color={isDark ? "#6ab7ff" : "#87ceeb"} transparent opacity={isDark ? 0.06 : 0.12} side={THREE.BackSide} />
      </Sphere>
      <Sphere args={[1.65, 64, 64]}>
        <meshBasicMaterial color={isDark ? "#4d9fff" : "#a0d8ef"} transparent opacity={isDark ? 0.04 : 0.1} side={THREE.BackSide} />
      </Sphere>

      {/* Coverage tiles rotate with the Earth — no desync */}
      {children}
    </group>
  );
};

// Scene with lighting
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  selectedIndex: number | null;
  onSelectIndex: (idx: number | null) => void;
  isPersonalView?: boolean;
  isDark?: boolean;
}> = ({ cells, selectedIndex, onSelectIndex, isPersonalView, isDark = true }) => {
  const tiles = useMemo(() => prepareTiles(cells), [cells]);

  return (
    <>
      <ambientLight intensity={isDark ? 0.4 : 0.8} color={isDark ? "#b8d4ff" : "#ffffff"} />
      <directionalLight position={[5, 2, 5]} intensity={isDark ? 1.8 : 2.8} color={isDark ? "#fff5e6" : "#fffdf5"} />
      <directionalLight position={[-5, -2, -5]} intensity={isDark ? 0.15 : 0.5} color={isDark ? "#4da6ff" : "#87ceeb"} />
      <directionalLight position={[0, 5, -3]} intensity={isDark ? 0.3 : 0.6} color="#87ceeb" />
      

      <Earth isDark={isDark}>
        <InstancedCoverageTiles
          tiles={tiles}
          selectedIndex={selectedIndex}
          onSelectIndex={onSelectIndex}
        />
      </Earth>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={isPersonalView ? 1.6 : 2.0}
        maxDistance={6}
        autoRotate={selectedIndex === null && !isPersonalView}
        autoRotateSpeed={0.2}
        dampingFactor={0.05}
        enableDamping
        rotateSpeed={0.3}
        zoomSpeed={0.8}
      />
    </>
  );
};

// Loading fallback
const GlobeLoading: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm font-medium text-muted-foreground">Loading globe...</span>
    </div>
  </div>
);

// Error boundary for 3D canvas
const GlobeErrorFallback: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-muted to-background">
    <div className="text-center p-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-3xl">🌍</span>
      </div>
      <p className="text-muted-foreground text-sm">Globe temporarily unavailable</p>
      <p className="text-muted-foreground/60 text-xs mt-1">Pull down to refresh</p>
    </div>
  </div>
);

// Main component
export const NetworkGlobe: React.FC<NetworkGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
  allTimeCities = 0,
  totalContributors = 0,
  isPersonalView = false,
  userPosition = null,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const initialCameraZ = isPersonalView ? 2.5 : 3.5;

  const realStats = useMemo(() => ({
    dataPoints: totalDataPoints || coverageData.reduce((sum, c) => sum + c.count, 0),
    cities: allTimeCities || uniqueLocations || coverageData.length,
    contributors: totalContributors,
  }), [coverageData, totalDataPoints, uniqueLocations, allTimeCities, totalContributors]);

  if (hasError) return <GlobeErrorFallback />;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-transparent">
      {/* Header with aggregated data label */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-background via-background/60 to-transparent" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-center mb-1">
          <span className="text-foreground/70 text-xs font-medium">Aggregated Network Coverage</span>
        </div>

        {/* Privacy disclaimer */}
        <p className="text-center text-foreground/40 text-[9px] mb-2">
          Anonymized, aggregated measurements — not individual users
        </p>

        {/* Legend — coverage quality tiers */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span className="text-foreground/60 text-[10px] font-medium">Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-foreground/60 text-[10px] font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-foreground/60 text-[10px] font-medium">Weak</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {formatStatNumber(realStats.dataPoints)}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Samples</div>
          </div>
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {formatStatNumber(realStats.cities)}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Areas</div>
          </div>
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.contributors > 0 ? formatStatNumber(realStats.contributors) : '—'}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Contributors</div>
          </div>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      <div className="absolute left-0 right-0 bottom-0 top-[110px] flex items-center justify-center pointer-events-none" style={{ touchAction: 'none' }}>
        <div
          className="w-[220px] h-[220px] md:w-[280px] md:h-[280px] rounded-full overflow-hidden"
          style={{ pointerEvents: 'auto', touchAction: 'pan-y' }}
        >
          <Suspense fallback={<GlobeLoading />}>
            <Canvas
              camera={{ position: [0, 0.3, initialCameraZ], fov: 45 }}
              frameloop={isVisible ? 'always' : 'never'}
              gl={{
                antialias: false,
                alpha: true,
                powerPreference: 'low-power',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2,
              }}
              dpr={[1, 1.5]}
              onPointerMissed={() => setSelectedIndex(null)}
              onError={() => setHasError(true)}
              style={{ touchAction: 'pan-y' }}
            >
              <GlobeScene
                cells={coverageData}
                selectedIndex={selectedIndex}
                onSelectIndex={setSelectedIndex}
                isPersonalView={isPersonalView}
                isDark={isDark}
              />
            </Canvas>
          </Suspense>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary text-sm font-medium">Loading coverage data...</span>
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default NetworkGlobe;
