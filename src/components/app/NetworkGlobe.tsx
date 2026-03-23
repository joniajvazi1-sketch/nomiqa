import React, { useRef, useMemo, Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
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

const getQualityTier = (intensity: number): 'strong' | 'medium' | 'weak' => {
  if (intensity > 0.6) return 'strong';
  if (intensity > 0.3) return 'medium';
  return 'weak';
};

const QUALITY_COLORS = {
  strong: { base: new THREE.Color('#22c55e'), glow: new THREE.Color('#86efac') },
  medium: { base: new THREE.Color('#f59e0b'), glow: new THREE.Color('#fcd34d') },
  weak:   { base: new THREE.Color('#ef4444'), glow: new THREE.Color('#fca5a5') },
};

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

const prepareTiles = (cells: GlobalCoverageCell[]): TileData[] => {
  if (!cells || cells.length === 0) return [];

  return cells.slice(0, 500).map(cell => {
    const signalIntensity = typeof cell.intensity === 'number' ? cell.intensity : 0.5;
    const quality = getQualityTier(signalIntensity);
    const networkLabel = cell.network === '5g' ? '5G' :
      cell.network === 'lte' ? 'LTE' :
      cell.network === '3g' ? '3G' : 'Mixed';
    // Larger hexagons so they're clearly visible
    const tileSize = Math.min(0.08 + (cell.count / 50) * 0.03, 0.18);

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

// InstancedMesh hexagonal coverage tiles
const InstancedCoverageTiles: React.FC<{ tiles: TileData[] }> = ({ tiles }) => {
  const discRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  const hexGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(1, 6);
    geo.rotateZ(Math.PI / 6);
    return geo;
  }, []);
  const hexRingGeo = useMemo(() => {
    const geo = new THREE.RingGeometry(1, 1.6, 6);
    geo.rotateZ(Math.PI / 6);
    return geo;
  }, []);

  useEffect(() => {
    if (!discRef.current || !glowRef.current || tiles.length === 0) return;

    const tempMatrix = new THREE.Matrix4();
    const tempQuat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    const tempColor = new THREE.Color();

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      tempQuat.setFromUnitVectors(up, t.normal);

      tempMatrix.compose(t.position, tempQuat, new THREE.Vector3(t.tileSize, t.tileSize, 1));
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
  }, [tiles]);

  const count = tiles.length;
  if (count === 0) return null;

  return (
    <>
      <instancedMesh ref={discRef} args={[hexGeo, undefined, count]}>
        <meshBasicMaterial transparent opacity={0.9} vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={glowRef} args={[hexRingGeo, undefined, count]}>
        <meshBasicMaterial transparent opacity={0.3} vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
};

// Ultra-realistic Earth
const Earth: React.FC<{ isDark?: boolean; children?: React.ReactNode }> = ({ isDark = true, children }) => {
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
    if (groupRef.current) groupRef.current.rotation.y += 0.0004;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0002;
  });

  return (
    <group ref={groupRef}>
      {/* Main Earth sphere — high detail */}
      <mesh>
        <sphereGeometry args={[1.5, 128, 128]} />
        <meshPhongMaterial
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.02}
          specularMap={specularTexture}
          specular={new THREE.Color(isDark ? 0x444444 : 0x888888)}
          shininess={isDark ? 30 : 50}
        />
      </mesh>
      {/* Night lights layer */}
      {isDark && (
        <mesh>
          <sphereGeometry args={[1.501, 128, 128]} />
          <meshBasicMaterial map={nightTexture} transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.52, 64, 64]} />
        <meshPhongMaterial color="#ffffff" transparent opacity={isDark ? 0.1 : 0.2} depthWrite={false} />
      </mesh>
      {/* Atmosphere inner glow */}
      <Sphere args={[1.56, 64, 64]}>
        <meshBasicMaterial color={isDark ? "#6ab7ff" : "#87ceeb"} transparent opacity={isDark ? 0.07 : 0.12} side={THREE.BackSide} />
      </Sphere>
      {/* Atmosphere outer glow */}
      <Sphere args={[1.68, 64, 64]}>
        <meshBasicMaterial color={isDark ? "#4d9fff" : "#a0d8ef"} transparent opacity={isDark ? 0.05 : 0.1} side={THREE.BackSide} />
      </Sphere>

      {children}
    </group>
  );
};

// Scene — no zoom, just auto-rotate
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  isDark?: boolean;
}> = ({ cells, isDark = true }) => {
  const tiles = useMemo(() => prepareTiles(cells), [cells]);

  return (
    <>
      <ambientLight intensity={isDark ? 0.5 : 0.9} color={isDark ? "#b8d4ff" : "#ffffff"} />
      <directionalLight position={[5, 2, 5]} intensity={isDark ? 2.0 : 3.0} color={isDark ? "#fff5e6" : "#fffdf5"} />
      <directionalLight position={[-5, -2, -5]} intensity={isDark ? 0.2 : 0.6} color={isDark ? "#4da6ff" : "#87ceeb"} />
      <directionalLight position={[0, 5, -3]} intensity={isDark ? 0.4 : 0.7} color="#87ceeb" />

      <Earth isDark={isDark}>
        <InstancedCoverageTiles tiles={tiles} />
      </Earth>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2.0}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
        enableDamping
        rotateSpeed={0.3}
        zoomSpeed={0.8}
      />
    </>
  );
};

const GlobeLoading: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm font-medium text-muted-foreground">Loading globe...</span>
    </div>
  </div>
);

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

export const NetworkGlobe: React.FC<NetworkGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
  allTimeCities = 0,
  totalContributors = 0,
  isPersonalView = false,
}) => {
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

  const realStats = useMemo(() => ({
    dataPoints: totalDataPoints || coverageData.reduce((sum, c) => sum + c.count, 0),
    cities: allTimeCities || uniqueLocations || coverageData.length,
    contributors: totalContributors,
  }), [coverageData, totalDataPoints, uniqueLocations, allTimeCities, totalContributors]);

  if (hasError) return <GlobeErrorFallback />;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-transparent">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-background via-background/60 to-transparent" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-center mb-1">
          <span className="text-foreground/70 text-xs font-medium">Aggregated Network Coverage</span>
        </div>
        <p className="text-center text-foreground/40 text-[9px] mb-2">
          Anonymized, aggregated measurements — not individual users
        </p>
        {/* Legend */}
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
        {/* Stats */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.dataPoints >= 1000 ? `${Math.round(realStats.dataPoints / 1000)}k` : realStats.dataPoints}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Samples</div>
          </div>
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.cities >= 1000 ? `${Math.round(realStats.cities / 1000)}k` : realStats.cities}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Areas</div>
          </div>
          <div className="flex-1 bg-muted/80 dark:bg-white/5 backdrop-blur-md border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.contributors >= 1000 ? `${Math.round(realStats.contributors / 1000)}k` : realStats.contributors > 0 ? realStats.contributors : '—'}
            </div>
            <div className="text-foreground/50 text-[10px] font-medium">Contributors</div>
          </div>
        </div>
      </div>

      {/* 3D Globe — full width, no clipping */}
      <div className="absolute inset-0 top-[110px]" style={{ touchAction: 'pan-y' }}>
        <Suspense fallback={<GlobeLoading />}>
          <Canvas
            camera={{ position: [0, 0.3, 3.5], fov: 45 }}
            frameloop={isVisible ? 'always' : 'never'}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'default',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.3,
            }}
            dpr={[1, 2]}
            onError={() => setHasError(true)}
            style={{ touchAction: 'pan-y' }}
          >
            <GlobeScene cells={coverageData} isDark={isDark} />
          </Canvas>
        </Suspense>
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
