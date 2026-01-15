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
  isPersonalView?: boolean; // Start zoomed in for personal view
  userPosition?: [number, number] | null; // User's current position
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
  cityName: string; // Approximate city/region name
}

// Get approximate city/region name from coordinates (privacy-respecting)
const getApproximateLocation = (lat: number, lng: number): string => {
  // Major world regions mapped to approximate lat/lng ranges
  const regions: { name: string; latMin: number; latMax: number; lngMin: number; lngMax: number }[] = [
    // Europe
    { name: 'London Area', latMin: 51, latMax: 52, lngMin: -1, lngMax: 1 },
    { name: 'Paris Area', latMin: 48, latMax: 49, lngMin: 2, lngMax: 3 },
    { name: 'Berlin Area', latMin: 52, latMax: 53, lngMin: 13, lngMax: 14 },
    { name: 'Madrid Area', latMin: 40, latMax: 41, lngMin: -4, lngMax: -3 },
    { name: 'Rome Area', latMin: 41, latMax: 42, lngMin: 12, lngMax: 13 },
    { name: 'Amsterdam Area', latMin: 52, latMax: 53, lngMin: 4, lngMax: 5 },
    // North America
    { name: 'New York Area', latMin: 40, latMax: 41, lngMin: -75, lngMax: -73 },
    { name: 'Los Angeles Area', latMin: 33, latMax: 35, lngMin: -119, lngMax: -117 },
    { name: 'Chicago Area', latMin: 41, latMax: 42, lngMin: -88, lngMax: -87 },
    { name: 'Toronto Area', latMin: 43, latMax: 44, lngMin: -80, lngMax: -79 },
    { name: 'San Francisco Area', latMin: 37, latMax: 38, lngMin: -123, lngMax: -122 },
    // Asia
    { name: 'Tokyo Area', latMin: 35, latMax: 36, lngMin: 139, lngMax: 140 },
    { name: 'Singapore Area', latMin: 1, latMax: 2, lngMin: 103, lngMax: 104 },
    { name: 'Hong Kong Area', latMin: 22, latMax: 23, lngMin: 113, lngMax: 115 },
    { name: 'Seoul Area', latMin: 37, latMax: 38, lngMin: 126, lngMax: 127 },
    { name: 'Mumbai Area', latMin: 18, latMax: 20, lngMin: 72, lngMax: 73 },
    { name: 'Dubai Area', latMin: 24, latMax: 26, lngMin: 54, lngMax: 56 },
    // Australia/Oceania
    { name: 'Sydney Area', latMin: -34, latMax: -33, lngMin: 150, lngMax: 152 },
    { name: 'Melbourne Area', latMin: -38, latMax: -37, lngMin: 144, lngMax: 146 },
    // South America
    { name: 'São Paulo Area', latMin: -24, latMax: -23, lngMin: -47, lngMax: -46 },
    { name: 'Buenos Aires Area', latMin: -35, latMax: -34, lngMin: -59, lngMax: -58 },
    // Africa
    { name: 'Cape Town Area', latMin: -35, latMax: -33, lngMin: 18, lngMax: 19 },
    { name: 'Cairo Area', latMin: 29, latMax: 31, lngMin: 30, lngMax: 32 },
  ];
  
  // Check if coordinates match a known region
  for (const region of regions) {
    if (lat >= region.latMin && lat <= region.latMax && lng >= region.lngMin && lng <= region.lngMax) {
      return region.name;
    }
  }
  
  // Fallback: Generate general region description based on hemisphere and zone
  const latZone = lat > 60 ? 'Northern' : lat > 30 ? 'Central' : lat > 0 ? 'Southern' : lat > -30 ? 'Tropical' : 'Southern';
  const lngZone = lng < -100 ? 'Pacific' : lng < -30 ? 'Americas' : lng < 30 ? 'Atlantic' : lng < 80 ? 'Central' : lng < 140 ? 'Asia' : 'Pacific';
  
  return `${latZone} ${lngZone} Region`;
};

// City-level data marker (smaller for cleaner look)
const DataHotspot: React.FC<{
  marker: DataPointMarker;
  onSelect: (marker: DataPointMarker | null) => void;
  isSelected: boolean;
}> = ({ marker, onSelect, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseSpeed = useRef(Math.random() * 0.8 + 0.3);
  
  // SMALLER dots - reduced size for cleaner look
  const baseSize = Math.min(0.012 + (marker.count / 50) * 0.008, 0.035);
  
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed.current) * 0.1 + 0.95;
      meshRef.current.scale.setScalar(isSelected ? 1.4 : pulse);
      glowRef.current.scale.setScalar(isSelected ? 1.8 : pulse * 1.4);
    }
  });

  // Color based on intensity - green=high, cyan=medium, purple=new
  const color = marker.intensity > 0.7 ? '#22c55e' : marker.intensity > 0.4 ? '#06b6d4' : '#a855f7';

  return (
    <group 
      position={marker.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : marker);
      }}
    >
      {/* Core point - smaller */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Inner glow - reduced */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * 1.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      
      {/* Outer glow - more subtle */}
      <mesh>
        <sphereGeometry args={[baseSize * 2.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      
      {/* Popup when selected - shows city/region name, NOT coordinates */}
      {isSelected && (
        <Html center distanceFactor={4}>
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 min-w-[120px] shadow-xl pointer-events-auto">
            <p className="text-gray-900 font-bold text-xs">
              {marker.cityName}
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
  
  // Convert real coverage data to markers with city names
  const markers = useMemo<DataPointMarker[]>(() => {
    if (!cells || cells.length === 0) return [];
    
    const maxCount = Math.max(...cells.map(c => c.count), 1);
    
    return cells.slice(0, 200).map(cell => ({
      lat: cell.lat,
      lng: cell.lng,
      count: cell.count,
      position: latLngToVector3(cell.lat, cell.lng, 1.54),
      intensity: cell.count / maxCount,
      cityName: getApproximateLocation(cell.lat, cell.lng),
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
  isPersonalView?: boolean;
}> = ({ cells, selectedMarker, onSelectMarker, isPersonalView }) => {
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
        minDistance={isPersonalView ? 1.6 : 2.0}
        maxDistance={6}
        autoRotate={!selectedMarker && !isPersonalView}
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
  isPersonalView = false,
  userPosition = null,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<DataPointMarker | null>(null);
  const [hasError, setHasError] = useState(false);
  
  // Personal view starts very zoomed in (close to surface), global starts zoomed out
  // Camera z: lower = closer/more zoomed in, higher = farther/zoomed out
  const initialCameraZ = isPersonalView ? 1.7 : 3.2;
  
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
        
        {/* Legend - moved here */}
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
        
        {/* Stats row - shows REAL data from database */}
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

      {/* 3D Globe Canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[65vh] max-h-[550px]">
          <Suspense fallback={<GlobeLoading />}>
            <Canvas
              camera={{ position: [0, 0.2, initialCameraZ], fov: 45 }}
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
                isPersonalView={isPersonalView}
              />
            </Canvas>
          </Suspense>
        </div>
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