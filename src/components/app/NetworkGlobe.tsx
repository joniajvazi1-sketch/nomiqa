import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GlobalCoverageCell } from '@/hooks/useGlobalCoverage';

interface NetworkGlobeProps {
  coverageData: GlobalCoverageCell[];
  loading?: boolean;
  totalDataPoints?: number;
  uniqueLocations?: number;
  coverageAreaKm2?: number;
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

// Ultra-realistic Earth with NASA textures
const Earth: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const nightRef = useRef<THREE.Mesh>(null);
  
  // Load high-quality NASA textures - using reliable URLs
  const dayTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg');
  const bumpTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
  const specularTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png');
  const nightTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg');
  
  // Improve texture quality
  [dayTexture, bumpTexture, specularTexture, nightTexture].forEach(tex => {
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.00015;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Earth sphere with photorealistic PBR material */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 128, 128]} />
        <meshPhongMaterial
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.015}
          specularMap={specularTexture}
          specular={new THREE.Color(0x333333)}
          shininess={25}
        />
      </mesh>
      
      {/* Night side with city lights - blended additively */}
      <mesh ref={nightRef}>
        <sphereGeometry args={[1.501, 128, 128]} />
        <meshBasicMaterial
          map={nightTexture}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Simulated cloud layer - no external texture needed */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.52, 64, 64]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner atmosphere - Rayleigh scattering */}
      <Sphere args={[1.55, 64, 64]}>
        <meshBasicMaterial
          color="#6ab7ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Outer atmosphere glow - Fresnel effect */}
      <Sphere args={[1.65, 64, 64]}>
        <meshBasicMaterial
          color="#4d9fff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Faint haze */}
      <Sphere args={[1.75, 64, 64]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.02}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

interface DataPointMarker {
  lat: number;
  lng: number;
  count: number;
  position: THREE.Vector3;
  intensity: number;
}

// Real data point from database
const DataHotspot: React.FC<{
  marker: DataPointMarker;
  onSelect: (marker: DataPointMarker | null) => void;
  isSelected: boolean;
}> = ({ marker, onSelect, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseSpeed = useRef(Math.random() * 1.2 + 0.4);
  
  // Size based on data count
  const baseSize = Math.min(0.012 + (marker.count / 50) * 0.008, 0.04);
  
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed.current) * 0.12 + 0.94;
      meshRef.current.scale.setScalar(isSelected ? 1.5 : pulse);
      glowRef.current.scale.setScalar(isSelected ? 2 : pulse * 1.5);
    }
  });

  // Color based on intensity
  const color = marker.intensity > 0.7 ? '#22c55e' : marker.intensity > 0.4 ? '#06b6d4' : '#a855f7';

  return (
    <group 
      position={marker.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : marker);
      }}
    >
      {/* Core point */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * 2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[baseSize * 3.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      
      {/* Popup when selected */}
      {isSelected && (
        <Html center distanceFactor={4}>
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 min-w-[110px] shadow-xl pointer-events-auto">
            <p className="text-gray-900 font-bold text-xs">
              {marker.lat.toFixed(2)}°, {marker.lng.toFixed(2)}°
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-cyan-600 text-sm font-bold">{marker.count}</span>
              <span className="text-gray-500 text-[10px]">data points</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Real data markers from database
const DataMarkers: React.FC<{
  cells: GlobalCoverageCell[];
  selectedMarker: DataPointMarker | null;
  onSelectMarker: (marker: DataPointMarker | null) => void;
}> = ({ cells, selectedMarker, onSelectMarker }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Convert real coverage data to markers
  const markers = useMemo<DataPointMarker[]>(() => {
    if (!cells || cells.length === 0) return [];
    
    const maxCount = Math.max(...cells.map(c => c.count), 1);
    
    return cells.slice(0, 200).map(cell => ({
      lat: cell.lat,
      lng: cell.lng,
      count: cell.count,
      position: latLngToVector3(cell.lat, cell.lng, 1.54),
      intensity: cell.count / maxCount,
    }));
  }, [cells]);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <group ref={groupRef}>
      {markers.map((marker, idx) => (
        <DataHotspot
          key={`${marker.lat}-${marker.lng}-${idx}`}
          marker={marker}
          onSelect={onSelectMarker}
          isSelected={selectedMarker?.lat === marker.lat && selectedMarker?.lng === marker.lng}
        />
      ))}
    </group>
  );
};

// Scene with enhanced lighting
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  selectedMarker: DataPointMarker | null;
  onSelectMarker: (marker: DataPointMarker | null) => void;
}> = ({ cells, selectedMarker, onSelectMarker }) => {
  return (
    <>
      {/* Photorealistic lighting setup */}
      <ambientLight intensity={0.25} color="#b8d4ff" />
      
      {/* Sun - main light source */}
      <directionalLight 
        position={[5, 2, 5]} 
        intensity={1.8} 
        color="#fff5e6"
      />
      
      {/* Soft fill from opposite side */}
      <directionalLight 
        position={[-5, -2, -5]} 
        intensity={0.15} 
        color="#4da6ff" 
      />
      
      {/* Rim light for atmosphere edge */}
      <directionalLight 
        position={[0, 5, -3]} 
        intensity={0.3} 
        color="#87ceeb" 
      />
      
      {/* Deep space stars */}
      <Stars
        radius={300}
        depth={100}
        count={3000}
        factor={3}
        saturation={0.1}
        fade
        speed={0.05}
      />
      
      <Earth />
      <DataMarkers 
        cells={cells} 
        selectedMarker={selectedMarker}
        onSelectMarker={onSelectMarker}
      />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2.0}
        maxDistance={6}
        autoRotate={!selectedMarker}
        autoRotateSpeed={0.2}
        dampingFactor={0.05}
        enableDamping
        rotateSpeed={0.3}
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
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0f1a] to-[#020408]">
    <div className="text-center p-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-3xl">🌍</span>
      </div>
      <p className="text-white/70 text-sm">Globe temporarily unavailable</p>
      <p className="text-white/40 text-xs mt-1">Pull down to refresh</p>
    </div>
  </div>
);

// Main component
export const NetworkGlobe: React.FC<NetworkGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<DataPointMarker | null>(null);
  const [hasError, setHasError] = useState(false);
  
  // Calculate real stats from data
  const realStats = useMemo(() => {
    const uniqueCountries = new Set(coverageData.map(c => `${Math.floor(c.lat / 10)}-${Math.floor(c.lng / 10)}`)).size;
    return {
      dataPoints: totalDataPoints || coverageData.reduce((sum, c) => sum + c.count, 0),
      locations: uniqueLocations || coverageData.length,
      regions: uniqueCountries || Math.min(coverageData.length, 30),
    };
  }, [coverageData, totalDataPoints, uniqueLocations]);

  if (hasError) {
    return <GlobeErrorFallback />;
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0a0f1a] via-[#050a12] to-[#020408] overflow-hidden">
      {/* Top stats bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
            </div>
            <span className="text-green-500 text-sm font-bold tracking-wide">LIVE</span>
          </div>
          <span className="text-white/40 text-xs">Community Coverage Map</span>
        </div>
        
        {/* Stats row */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.dataPoints.toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Data Points</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.locations.toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Locations</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.regions}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Regions</div>
          </div>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[65vh] max-h-[550px]">
          <Suspense fallback={<GlobeLoading />}>
            <Canvas
              camera={{ position: [0, 0.2, 3.2], fov: 45 }}
              gl={{ 
                antialias: true, 
                alpha: true, 
                powerPreference: 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2,
              }}
              dpr={[1, 2]}
              onPointerMissed={() => setSelectedMarker(null)}
              onError={() => setHasError(true)}
            >
              <GlobeScene 
                cells={coverageData}
                selectedMarker={selectedMarker}
                onSelectMarker={setSelectedMarker}
              />
            </Canvas>
          </Suspense>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-28 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-white/70 text-[10px] font-medium">High Activity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-white/70 text-[10px] font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-white/70 text-[10px] font-medium">New</span>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <span className="text-white/30 text-[10px]">Drag to rotate • Pinch to zoom • Tap marker for details</span>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020408]/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary text-sm font-medium">Loading network data...</span>
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020408] to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default NetworkGlobe;