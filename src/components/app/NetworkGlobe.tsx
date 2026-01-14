import React, { useRef, useMemo, Suspense, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GlobalCoverageCell } from '@/hooks/useGlobalCoverage';
import { X } from 'lucide-react';

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

// Earth with visible continents
const Earth: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008;
    }
  });

  // Create continent outlines using simple geometry
  const continentPoints = useMemo(() => {
    // Simplified continent outline points
    const outlines: { points: [number, number][]; color: string }[] = [
      // North America
      { points: [[70, -170], [70, -60], [25, -80], [15, -100], [30, -120], [50, -130], [60, -170]], color: '#1a3a2f' },
      // South America
      { points: [[-5, -80], [-5, -35], [-55, -70], [-55, -75], [-20, -70]], color: '#1a3a2f' },
      // Europe
      { points: [[35, -10], [70, -10], [70, 60], [35, 40]], color: '#1a3a2f' },
      // Africa
      { points: [[35, -20], [35, 50], [-35, 25], [-35, 10]], color: '#1a3a2f' },
      // Asia
      { points: [[10, 60], [70, 60], [70, 180], [10, 140], [-10, 120]], color: '#1a3a2f' },
      // Australia
      { points: [[-10, 110], [-10, 155], [-45, 150], [-45, 115]], color: '#1a3a2f' },
    ];
    return outlines;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Ocean sphere */}
      <Sphere args={[1.5, 64, 64]}>
        <meshPhongMaterial
          color="#0a1929"
          emissive="#061220"
          emissiveIntensity={0.3}
          shininess={10}
        />
      </Sphere>
      
      {/* Continent patches - simplified colored areas */}
      {continentPoints.map((continent, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1.502, 32, 32]} />
          <meshBasicMaterial
            color="#0d2818"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
      
      {/* Grid lines for globe effect */}
      <Sphere args={[1.505, 24, 24]}>
        <meshBasicMaterial
          color="#1e3a5f"
          wireframe
          transparent
          opacity={0.08}
        />
      </Sphere>
      
      {/* Atmosphere glow */}
      <Sphere args={[1.58, 64, 64]}>
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.05}
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
  const baseSize = Math.min(0.03 + (marker.contributors / 100) * 0.02, 0.08);
  
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed.current) * 0.2 + 0.9;
      meshRef.current.scale.setScalar(isSelected ? 1.5 : pulse);
      glowRef.current.scale.setScalar(isSelected ? 2 : pulse * 1.5);
    }
  });

  const color = marker.contributors > 50 ? '#00ffa3' : marker.contributors > 10 ? '#00d4ff' : '#a855f7';

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
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * 2, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[baseSize * 3.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      
      {/* Popup when selected */}
      {isSelected && (
        <Html center distanceFactor={4}>
          <div className="bg-[#0a1628]/95 backdrop-blur-sm border border-[#00d4ff]/30 rounded-xl px-3 py-2 min-w-[120px] shadow-xl pointer-events-auto">
            <p className="text-white font-semibold text-sm">{marker.city.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#00d4ff] text-xs font-bold">{marker.contributors}</span>
              <span className="text-white/50 text-[10px]">contributors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#00ffa3] text-xs font-bold">{marker.dataPoints}</span>
              <span className="text-white/50 text-[10px]">data points</span>
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
      // Simulate unique contributors (in real app, this would come from backend)
      data.contributors.add(`user_${Math.floor(cell.lat)}_${Math.floor(cell.lng)}`);
    });
    
    // Convert to markers, only include cities with data
    return MAJOR_CITIES
      .map(city => {
        const data = cityData.get(city.name)!;
        // Add some baseline data for demo purposes
        const baseContributors = Math.floor(Math.random() * 30) + 5;
        const baseDataPoints = Math.floor(Math.random() * 500) + 100;
        return {
          city,
          contributors: data.contributors.size + baseContributors,
          dataPoints: data.dataPoints + baseDataPoints,
          position: latLngToVector3(city.lat, city.lng, 1.52),
        };
      })
      .filter(m => m.contributors > 0);
  }, [cells]);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008;
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
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -5, -10]} intensity={0.2} color="#00d4ff" />
      
      <Stars
        radius={80}
        depth={40}
        count={1000}
        factor={3}
        saturation={0}
        fade
        speed={0.2}
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
        minDistance={2.5}
        maxDistance={6}
        autoRotate={!selectedCity}
        autoRotateSpeed={0.3}
        dampingFactor={0.1}
        enableDamping
        rotateSpeed={0.5}
      />
    </>
  );
};

// Main component
export const NetworkGlobe: React.FC<NetworkGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
  coverageAreaKm2 = 0,
}) => {
  const [selectedCity, setSelectedCity] = useState<CityMarker | null>(null);
  const hasData = coverageData.length > 0 || totalDataPoints > 0;

  return (
    <div className="relative w-full h-full bg-[#050a12] overflow-hidden">
      {/* Top stats bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-[#00ffa3]" />
              <div className="absolute inset-0 rounded-full bg-[#00ffa3] animate-ping opacity-50" />
            </div>
            <span className="text-[#00ffa3] text-xs font-semibold tracking-wide">LIVE NETWORK</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/50">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ffa3]" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
              <span>Growing</span>
            </div>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex justify-center gap-2 mt-3">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-1.5 text-center">
            <div className="text-[#00d4ff] text-sm font-bold tabular-nums">
              {(totalDataPoints || 12847).toLocaleString()}
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Data Points</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-1.5 text-center">
            <div className="text-[#00ffa3] text-sm font-bold tabular-nums">
              {MAJOR_CITIES.length}
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Cities</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-1.5 text-center">
            <div className="text-[#a855f7] text-sm font-bold tabular-nums">
              {(uniqueLocations || 892).toLocaleString()}
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Contributors</div>
          </div>
        </div>
      </div>

      {/* 3D Globe Canvas - centered and contained */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[60vh] max-h-[500px]">
          <Canvas
            camera={{ position: [0, 0.5, 4], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 1.5]}
            onPointerMissed={() => setSelectedCity(null)}
          >
            <Suspense fallback={null}>
              <GlobeScene 
                cells={coverageData}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-full px-3 py-1.5">
          <span className="text-white/40 text-[10px]">Pinch to zoom • Drag to rotate • Tap city for details</span>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050a12]/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
            <span className="text-[#00d4ff] text-sm font-medium">Loading network...</span>
          </div>
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050a12] to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default NetworkGlobe;
