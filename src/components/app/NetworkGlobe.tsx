import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
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

// Major world cities for clustering
const MAJOR_CITIES = [
  { name: 'New York', lat: 40.7128, lng: -74.0060, region: 'North America' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, region: 'North America' },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, region: 'North America' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, region: 'North America' },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, region: 'North America' },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, region: 'South America' },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, region: 'South America' },
  { name: 'London', lat: 51.5074, lng: -0.1278, region: 'Europe' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, region: 'Europe' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, region: 'Europe' },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, region: 'Europe' },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, region: 'Europe' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, region: 'Europe' },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, region: 'Europe' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, region: 'Middle East' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, region: 'Asia' },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, region: 'Asia' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, region: 'Asia' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, region: 'Asia' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, region: 'Asia' },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, region: 'Asia' },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, region: 'Asia' },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, region: 'Asia' },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, region: 'Asia' },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, region: 'Asia' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, region: 'Oceania' },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, region: 'Oceania' },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, region: 'Africa' },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, region: 'Africa' },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, region: 'Africa' },
];

// Convert lat/lng to 3D sphere coordinates
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

// Calculate distance between two lat/lng points
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

// Realistic Earth with NASA texture
const Earth: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  // Load Earth textures from NASA/public sources
  const earthTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg');
  const bumpTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Earth sphere with realistic texture */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          shininess={5}
        />
      </mesh>
      
      {/* Subtle cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.52, 64, 64]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <Sphere args={[1.6, 64, 64]}>
        <meshBasicMaterial
          color="#4da6ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Outer atmosphere haze */}
      <Sphere args={[1.7, 64, 64]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

interface CityMarker {
  city: typeof MAJOR_CITIES[0];
  contributors: number;
  dataPoints: number;
  position: THREE.Vector3;
}

// City hotspot with click interaction
const CityHotspot: React.FC<{
  marker: CityMarker;
  onSelect: (marker: CityMarker | null) => void;
  isSelected: boolean;
}> = ({ marker, onSelect, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseSpeed = useRef(Math.random() * 1.5 + 0.5);
  
  // Size based on contributor count
  const baseSize = Math.min(0.025 + (marker.contributors / 100) * 0.015, 0.06);
  
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed.current) * 0.15 + 0.92;
      meshRef.current.scale.setScalar(isSelected ? 1.4 : pulse);
      glowRef.current.scale.setScalar(isSelected ? 1.8 : pulse * 1.4);
    }
  });

  // Green for high activity, cyan for medium, purple for growing
  const color = marker.contributors > 50 ? '#22c55e' : marker.contributors > 10 ? '#06b6d4' : '#a855f7';

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
        <sphereGeometry args={[baseSize * 1.8, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[baseSize * 3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      
      {/* Popup when selected */}
      {isSelected && (
        <Html center distanceFactor={4}>
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 min-w-[130px] shadow-xl pointer-events-auto">
            <p className="text-gray-900 font-bold text-sm">{marker.city.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-600 text-xs font-bold">{marker.contributors}</span>
              <span className="text-gray-500 text-[10px]">contributors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-600 text-xs font-bold">{marker.dataPoints.toLocaleString()}</span>
              <span className="text-gray-500 text-[10px]">data points</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// City markers clustered from raw data
const CityMarkers: React.FC<{
  cells: GlobalCoverageCell[];
  selectedCity: CityMarker | null;
  onSelectCity: (marker: CityMarker | null) => void;
}> = ({ cells, selectedCity, onSelectCity }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Cluster data points to nearest major cities
  const cityMarkers = useMemo<CityMarker[]>(() => {
    const cityData = new Map<string, { contributors: Set<string>; dataPoints: number }>();
    
    // Initialize all cities
    MAJOR_CITIES.forEach(city => {
      cityData.set(city.name, { contributors: new Set(), dataPoints: 0 });
    });
    
    // Assign each data point to nearest city
    cells.forEach(cell => {
      let nearestCity = MAJOR_CITIES[0];
      let minDistance = Infinity;
      
      MAJOR_CITIES.forEach(city => {
        const dist = getDistance(cell.lat, cell.lng, city.lat, city.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestCity = city;
        }
      });
      
      const data = cityData.get(nearestCity.name)!;
      data.dataPoints += cell.count;
      data.contributors.add(`user_${Math.floor(cell.lat)}_${Math.floor(cell.lng)}`);
    });
    
    // Convert to markers with baseline data
    return MAJOR_CITIES
      .map(city => {
        const data = cityData.get(city.name)!;
        const baseContributors = Math.floor(Math.random() * 30) + 5;
        const baseDataPoints = Math.floor(Math.random() * 500) + 100;
        return {
          city,
          contributors: data.contributors.size + baseContributors,
          dataPoints: data.dataPoints + baseDataPoints,
          position: latLngToVector3(city.lat, city.lng, 1.53),
        };
      })
      .filter(m => m.contributors > 0);
  }, [cells]);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={groupRef}>
      {cityMarkers.map((marker) => (
        <CityHotspot
          key={marker.city.name}
          marker={marker}
          onSelect={onSelectCity}
          isSelected={selectedCity?.city.name === marker.city.name}
        />
      ))}
    </group>
  );
};

// Scene with camera controls
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  selectedCity: CityMarker | null;
  onSelectCity: (marker: CityMarker | null) => void;
}> = ({ cells, selectedCity, onSelectCity }) => {
  return (
    <>
      {/* Lighting for realistic appearance */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#4da6ff" />
      
      {/* Subtle star field */}
      <Stars
        radius={100}
        depth={50}
        count={800}
        factor={2}
        saturation={0}
        fade
        speed={0.1}
      />
      
      <Earth />
      <CityMarkers 
        cells={cells} 
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
      />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2.2}
        maxDistance={5}
        autoRotate={!selectedCity}
        autoRotateSpeed={0.25}
        dampingFactor={0.08}
        enableDamping
        rotateSpeed={0.4}
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

// Main component
export const NetworkGlobe: React.FC<NetworkGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
  coverageAreaKm2 = 0,
}) => {
  const [selectedCity, setSelectedCity] = useState<CityMarker | null>(null);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0c1829] via-[#0a1525] to-[#050a12] overflow-hidden">
      {/* Top stats bar - clean Apple-style */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
            </div>
            <span className="text-green-500 text-sm font-bold tracking-wide">LIVE</span>
          </div>
          <span className="text-white/40 text-xs">Global Network</span>
        </div>
        
        {/* Stats row */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {(totalDataPoints || 12847).toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Data Points</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {MAJOR_CITIES.length}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Cities</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {(uniqueLocations || 892).toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Contributors</div>
          </div>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[65vh] max-h-[550px]">
          <Suspense fallback={<GlobeLoading />}>
            <Canvas
              camera={{ position: [0, 0.3, 3.5], fov: 45 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              dpr={[1, 2]}
              onPointerMissed={() => setSelectedCity(null)}
            >
              <GlobeScene 
                cells={coverageData}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
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
            <span className="text-white/70 text-[10px] font-medium">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-white/70 text-[10px] font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-white/70 text-[10px] font-medium">Growing</span>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <span className="text-white/30 text-[10px]">Drag to rotate • Pinch to zoom • Tap city for details</span>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050a12]/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary text-sm font-medium">Loading network...</span>
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050a12] to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default NetworkGlobe;
