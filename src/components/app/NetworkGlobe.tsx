import React, { useRef, useMemo, Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
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

// Helium-style: single cyan/teal color with intensity-based brightness
const getHotspotColor = (intensity: number): THREE.Color => {
  // Bright cyan-teal, brighter for stronger signals
  const h = 0.5; // cyan hue
  const s = 0.85;
  const l = 0.35 + intensity * 0.35; // 0.35 to 0.70 lightness
  return new THREE.Color().setHSL(h, s, l);
};

const getGlowColor = (intensity: number): THREE.Color => {
  const h = 0.5;
  const s = 0.7;
  const l = 0.5 + intensity * 0.3;
  return new THREE.Color().setHSL(h, s, l);
};

interface TileData {
  lat: number;
  lng: number;
  count: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  intensity: number;
  networkType: string;
  tileSize: number;
}

// Prepare tile data from coverage cells
const prepareTiles = (cells: GlobalCoverageCell[]): TileData[] => {
  if (!cells || cells.length === 0) return [];

  return cells.slice(0, 500).map(cell => {
    const signalIntensity = typeof cell.intensity === 'number' ? cell.intensity : 0.5;
    const networkLabel = cell.network === '5g' ? '5G' :
      cell.network === 'lte' ? 'LTE' :
      cell.network === '3g' ? '3G' : 'Mixed';
    const tileSize = Math.min(0.025 + (cell.count / 100) * 0.015, 0.06);

    return {
      lat: cell.lat,
      lng: cell.lng,
      count: cell.count,
      position: latLngToVector3(cell.lat, cell.lng, 1.535),
      normal: getSurfaceNormal(cell.lat, cell.lng),
      intensity: signalIntensity,
      networkType: networkLabel,
      tileSize,
    };
  });
};

// Helium-style hotspot dots with glow
const InstancedCoverageTiles: React.FC<{
  tiles: TileData[];
  selectedIndex: number | null;
  onSelectIndex: (idx: number | null) => void;
}> = ({ tiles, selectedIndex, onSelectIndex }) => {
  const dotRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  // Dot geometry (small circle) and glow ring
  const dotGeo = useMemo(() => new THREE.CircleGeometry(1, 12), []);
  const glowGeo = useMemo(() => new THREE.CircleGeometry(1, 12), []);

  useEffect(() => {
    if (!dotRef.current || !glowRef.current || tiles.length === 0) return;

    const tempMatrix = new THREE.Matrix4();
    const tempQuat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    const tempColor = new THREE.Color();

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      tempQuat.setFromUnitVectors(up, t.normal);
      const scale = i === selectedIndex ? t.tileSize * 1.8 : t.tileSize;
      const glowScale = scale * 2.5;

      tempMatrix.compose(t.position, tempQuat, new THREE.Vector3(scale, scale, 1));
      dotRef.current.setMatrixAt(i, tempMatrix);

      tempMatrix.compose(t.position, tempQuat, new THREE.Vector3(glowScale, glowScale, 1));
      glowRef.current.setMatrixAt(i, tempMatrix);

      dotRef.current.setColorAt(i, tempColor.copy(getHotspotColor(t.intensity)));
      glowRef.current.setColorAt(i, tempColor.copy(getGlowColor(t.intensity)));
    }

    dotRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
    if (dotRef.current.instanceColor) dotRef.current.instanceColor.needsUpdate = true;
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
      {/* Glow behind dots */}
      <instancedMesh ref={glowRef} args={[glowGeo, undefined, count]}>
        <meshBasicMaterial transparent opacity={0.12} vertexColors side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>

      {/* Bright dot instances */}
      <instancedMesh ref={dotRef} args={[dotGeo, undefined, count]} onClick={handleClick}>
        <meshBasicMaterial transparent opacity={0.95} vertexColors side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Tooltip */}
      {selectedTile && (
        <group position={selectedTile.position}>
          <Html center distanceFactor={2.5} zIndexRange={[100, 0]} style={{ pointerEvents: 'auto' }}>
            <div
              className="relative bg-[#0f1729]/95 border border-cyan-500/30 rounded-lg px-3 py-2.5 min-w-[140px] max-w-[200px] shadow-[0_0_20px_rgba(0,200,255,0.15)] pointer-events-auto backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onSelectIndex(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-cyan-500 text-[#0a0f1e] rounded-full flex items-center justify-center text-[9px] font-bold leading-none shadow-md"
                aria-label="Close"
              >
                ✕
              </button>
              <p className="text-[10px] text-cyan-400/70 font-medium uppercase tracking-wider mb-1">Hotspot</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">Signal</span>
                  <span className="text-cyan-400 text-xs font-bold">
                    {selectedTile.intensity > 0.6 ? 'Strong' : selectedTile.intensity > 0.3 ? 'Medium' : 'Weak'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">Samples</span>
                  <span className="text-white text-xs font-bold">{selectedTile.count.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">Network</span>
                  <span className="text-white text-xs font-semibold">{selectedTile.networkType}</span>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}
    </>
  );
};

// Dark stylized Earth — Helium-style
const Earth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const groupRef = useRef<THREE.Group>(null);

  const dayTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg');
  const bumpTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');

  [dayTexture, bumpTexture].forEach(tex => {
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0004;
  });

  return (
    <group ref={groupRef}>
      {/* Dark earth surface */}
      <mesh>
        <sphereGeometry args={[1.5, 128, 128]} />
        <meshPhongMaterial
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.012}
          specular={new THREE.Color(0x111122)}
          shininess={5}
          emissive={new THREE.Color('#020a18')}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Atmosphere glow — inner */}
      <Sphere args={[1.54, 64, 64]}>
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.03} side={THREE.BackSide} depthWrite={false} />
      </Sphere>

      {/* Atmosphere glow — outer */}
      <Sphere args={[1.62, 64, 64]}>
        <meshBasicMaterial color="#0088cc" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Sphere>

      {/* Subtle edge rim */}
      <Sphere args={[1.72, 48, 48]}>
        <meshBasicMaterial color="#004466" transparent opacity={0.02} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Sphere>

      {/* Coverage tiles rotate with the Earth */}
      {children}
    </group>
  );
};

// Custom starfield — sparse, subtle
const Starfield: React.FC = () => {
  const starsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos];
  }, []);

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#4488aa" size={0.3} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

// Scene
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  selectedIndex: number | null;
  onSelectIndex: (idx: number | null) => void;
  isPersonalView?: boolean;
}> = ({ cells, selectedIndex, onSelectIndex, isPersonalView }) => {
  const tiles = useMemo(() => prepareTiles(cells), [cells]);

  return (
    <>
      {/* Subtle ambient — deep blue tint */}
      <ambientLight intensity={0.25} color="#1a2a4a" />
      {/* Main directional — cool white */}
      <directionalLight position={[5, 2, 5]} intensity={1.2} color="#c8d8ff" />
      {/* Rim light */}
      <directionalLight position={[-4, -1, -4]} intensity={0.15} color="#0066aa" />
      {/* Top fill */}
      <directionalLight position={[0, 5, -3]} intensity={0.2} color="#4488cc" />

      <Starfield />

      <Earth>
        <InstancedCoverageTiles
          tiles={tiles}
          selectedIndex={selectedIndex}
          onSelectIndex={onSelectIndex}
        />
      </Earth>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={isPersonalView ? 1.6 : 2.2}
        maxDistance={5.5}
        autoRotate={selectedIndex === null && !isPersonalView}
        autoRotateSpeed={0.3}
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
      <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      <span className="text-sm font-medium text-gray-400">Loading globe...</span>
    </div>
  </div>
);

// Error boundary
const GlobeErrorFallback: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1e]">
    <div className="text-center p-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
        <span className="text-3xl">🌍</span>
      </div>
      <p className="text-gray-400 text-sm">Globe temporarily unavailable</p>
      <p className="text-gray-500 text-xs mt-1">Pull down to refresh</p>
    </div>
  </div>
);

// Format large numbers
const formatStat = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n > 0 ? n.toString() : '—';
};

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

  const initialCameraZ = isPersonalView ? 2.5 : 3.2;

  const realStats = useMemo(() => ({
    dataPoints: totalDataPoints || coverageData.reduce((sum, c) => sum + c.count, 0),
    cities: allTimeCities || uniqueLocations || coverageData.length,
    contributors: totalContributors,
  }), [coverageData, totalDataPoints, uniqueLocations, allTimeCities, totalContributors]);

  if (hasError) return <GlobeErrorFallback />;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #060c1a 0%, #0a1228 40%, #0d1830 100%)' }}>
      {/* Helium-style header — minimal */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3 pb-2" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-center mb-1">
          <span className="text-cyan-400/60 text-[10px] font-medium uppercase tracking-[0.15em]">
            Network Coverage
          </span>
        </div>
        <p className="text-center text-gray-500/60 text-[9px] mb-2">
          Anonymized & aggregated measurements
        </p>
      </div>

      {/* 3D Globe — full width, no circle constraint */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ touchAction: 'none' }}>
        <div
          className="w-full h-full"
          style={{ pointerEvents: 'auto', touchAction: 'pan-y' }}
        >
          <Suspense fallback={<GlobeLoading />}>
            <Canvas
              camera={{ position: [0, 0.2, initialCameraZ], fov: 45 }}
              frameloop={isVisible ? 'always' : 'never'}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'low-power',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.0,
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
              />
            </Canvas>
          </Suspense>
        </div>
      </div>

      {/* Bottom stats bar — Helium-style */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-gradient-to-t from-[#060c1a] via-[#060c1a]/95 to-transparent pt-10 pb-4 px-4">
          <div className="flex justify-between gap-2">
            <div className="flex-1 bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
              <div className="text-white text-sm font-bold tabular-nums">
                {formatStat(realStats.dataPoints)}
              </div>
              <div className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">Samples</div>
            </div>
            <div className="flex-1 bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
              <div className="text-white text-sm font-bold tabular-nums">
                {formatStat(realStats.cities)}
              </div>
              <div className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">Areas</div>
            </div>
            <div className="flex-1 bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
              <div className="text-white text-sm font-bold tabular-nums">
                {formatStat(realStats.contributors)}
              </div>
              <div className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">Nodes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-30" style={{ background: 'rgba(6,12,26,0.9)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-cyan-400 text-sm font-medium">Loading coverage...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGlobe;
