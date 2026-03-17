import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, Html } from '@react-three/drei';
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

// Get surface normal at a point (points away from globe center)
const getSurfaceNormal = (lat: number, lng: number): THREE.Vector3 => {
  return latLngToVector3(lat, lng, 1).normalize();
};

// Ultra-realistic Earth with NASA textures
const Earth: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

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
    if (groupRef.current) groupRef.current.rotation.y += 0.0003;
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
    </group>
  );
};

// Aggregated coverage tile marker
interface CoverageTileData {
  lat: number;
  lng: number;
  count: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  quality: 'strong' | 'medium' | 'weak';
  networkType: string;
  avgSignalLabel: string;
}

// Get quality tier from intensity
const getQualityTier = (intensity: number): 'strong' | 'medium' | 'weak' => {
  if (intensity > 0.6) return 'strong';
  if (intensity > 0.3) return 'medium';
  return 'weak';
};

// Color map for quality tiers
const QUALITY_COLORS = {
  strong: { base: new THREE.Color('#22c55e'), glow: new THREE.Color('#86efac') },
  medium: { base: new THREE.Color('#f59e0b'), glow: new THREE.Color('#fcd34d') },
  weak:   { base: new THREE.Color('#ef4444'), glow: new THREE.Color('#fca5a5') },
};

// Flat coverage tile on globe surface
const CoverageTile: React.FC<{
  tile: CoverageTileData;
  onSelect: (tile: CoverageTileData | null) => void;
  isSelected: boolean;
}> = ({ tile, onSelect, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const colors = QUALITY_COLORS[tile.quality];

  // Tile size scales with data density, capped
  const tileSize = Math.min(0.025 + (tile.count / 100) * 0.012, 0.06);

  // Create a quaternion to orient the disc to the surface normal
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    q.setFromUnitVectors(up, tile.normal);
    return q;
  }, [tile.normal]);

  // No pulsing animation — static tiles for analytics look
  useFrame(() => {
    if (meshRef.current) {
      const s = isSelected ? 1.6 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(s, s, 1), 0.12);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(isSelected ? null : tile);
  };

  return (
    <group position={tile.position} quaternion={quaternion}>
      {/* Flat coverage disc */}
      <mesh ref={meshRef} onClick={handleClick}>
        <circleGeometry args={[tileSize, 16]} />
        <meshBasicMaterial color={colors.base} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Soft glow ring around tile */}
      <mesh ref={glowRef}>
        <ringGeometry args={[tileSize, tileSize * 1.6, 16]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Invisible larger click target */}
      <mesh onClick={handleClick}>
        <circleGeometry args={[tileSize * 3, 8]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Tooltip popup when selected */}
      {isSelected && (
        <Html center distanceFactor={2.5} zIndexRange={[100, 0]} style={{ pointerEvents: 'auto' }}>
          <div
            className="relative bg-card border border-border rounded-lg px-3 py-2.5 min-w-[140px] max-w-[200px] shadow-xl pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
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
                  tile.quality === 'strong' ? 'text-green-500' :
                  tile.quality === 'medium' ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {tile.avgSignalLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px]">Samples</span>
                <span className="text-foreground text-xs font-bold">{tile.count.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px]">Network</span>
                <span className="text-foreground text-xs font-semibold">{tile.networkType}</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Aggregated coverage tiles from database cells
const CoverageTiles: React.FC<{
  cells: GlobalCoverageCell[];
  selectedTile: CoverageTileData | null;
  onSelectTile: (tile: CoverageTileData | null) => void;
}> = ({ cells, selectedTile, onSelectTile }) => {
  const groupRef = useRef<THREE.Group>(null);

  const tiles = useMemo<CoverageTileData[]>(() => {
    if (!cells || cells.length === 0) return [];

    const maxCount = Math.max(...cells.map(c => c.count), 1);

    return cells.slice(0, 500).map(cell => {
      const intensity = cell.count / maxCount;
      const quality = getQualityTier(intensity);
      const networkLabel = cell.network === '5g' ? '5G' :
        cell.network === 'lte' ? 'LTE' :
        cell.network === '3g' ? '3G' : 'Mixed';

      return {
        lat: cell.lat,
        lng: cell.lng,
        count: cell.count,
        position: latLngToVector3(cell.lat, cell.lng, 1.52),
        normal: getSurfaceNormal(cell.lat, cell.lng),
        quality,
        networkType: networkLabel,
        avgSignalLabel: quality === 'strong' ? 'Strong' : quality === 'medium' ? 'Medium' : 'Weak',
      };
    });
  }, [cells]);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0003;
  });

  return (
    <group ref={groupRef}>
      {tiles.map((tile, idx) => (
        <CoverageTile
          key={`tile-${tile.lat}-${tile.lng}-${idx}`}
          tile={tile}
          onSelect={onSelectTile}
          isSelected={selectedTile?.lat === tile.lat && selectedTile?.lng === tile.lng}
        />
      ))}
    </group>
  );
};

// Scene with lighting
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  selectedTile: CoverageTileData | null;
  onSelectTile: (tile: CoverageTileData | null) => void;
  isPersonalView?: boolean;
  isDark?: boolean;
}> = ({ cells, selectedTile, onSelectTile, isPersonalView, isDark = true }) => {
  return (
    <>
      <ambientLight intensity={isDark ? 0.4 : 0.8} color={isDark ? "#b8d4ff" : "#ffffff"} />
      <directionalLight position={[5, 2, 5]} intensity={isDark ? 1.8 : 2.8} color={isDark ? "#fff5e6" : "#fffdf5"} />
      <directionalLight position={[-5, -2, -5]} intensity={isDark ? 0.15 : 0.5} color={isDark ? "#4da6ff" : "#87ceeb"} />
      <directionalLight position={[0, 5, -3]} intensity={isDark ? 0.3 : 0.6} color="#87ceeb" />
      {isDark && <Stars radius={100} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />}

      <Earth isDark={isDark} />
      <CoverageTiles cells={cells} selectedTile={selectedTile} onSelectTile={onSelectTile} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={isPersonalView ? 1.6 : 2.0}
        maxDistance={6}
        autoRotate={!selectedTile && !isPersonalView}
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
  const [selectedTile, setSelectedTile] = useState<CoverageTileData | null>(null);
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

  const initialCameraZ = isPersonalView ? 2.5 : 50;

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
              {realStats.dataPoints.toLocaleString()}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Samples</div>
          </div>
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.cities.toLocaleString()}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Areas</div>
          </div>
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.contributors > 0 ? realStats.contributors : '—'}
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
              onPointerMissed={() => setSelectedTile(null)}
              onError={() => setHasError(true)}
              style={{ touchAction: 'pan-y' }}
            >
              <GlobeScene
                cells={coverageData}
                selectedTile={selectedTile}
                onSelectTile={setSelectedTile}
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
