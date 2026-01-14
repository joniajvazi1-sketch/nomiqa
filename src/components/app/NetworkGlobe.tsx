import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { GlobalCoverageCell } from '@/hooks/useGlobalCoverage';
import { Globe, MapPin, Radio } from 'lucide-react';

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

// Network type to color mapping
const getNetworkColor = (network: string): THREE.Color => {
  switch (network) {
    case '5g': return new THREE.Color(0x06b6d4); // Cyan
    case 'lte': return new THREE.Color(0x3b82f6); // Blue
    case '3g': return new THREE.Color(0xf59e0b); // Amber
    default: return new THREE.Color(0x8b5cf6); // Purple
  }
};

// Beautiful Earth sphere with gradient
const Earth: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group>
      {/* Main globe - ocean blue */}
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshPhongMaterial
          color="#1e40af"
          emissive="#1e3a8a"
          emissiveIntensity={0.1}
          shininess={30}
        />
      </Sphere>
      
      {/* Continents overlay effect */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.15}
          wireframe
        />
      </Sphere>
      
      {/* Atmosphere glow */}
      <Sphere args={[2.15, 32, 32]}>
        <meshBasicMaterial
          color="#93c5fd"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

// Data points on globe
const DataPoints: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const points = useMemo(() => {
    return cells.map((cell) => ({
      position: latLngToVector3(cell.lat, cell.lng, 2.08),
      color: getNetworkColor(cell.network),
      size: 0.04 + Math.min(cell.count / 30, 0.06),
    }));
  }, [cells]);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  if (cells.length === 0) return null;

  return (
    <group ref={groupRef}>
      {points.map((point, i) => (
        <group key={i} position={point.position}>
          {/* Core point */}
          <mesh>
            <sphereGeometry args={[point.size, 12, 12]} />
            <meshBasicMaterial color={point.color} />
          </mesh>
          {/* Glow */}
          <mesh>
            <sphereGeometry args={[point.size * 2.5, 12, 12]} />
            <meshBasicMaterial color={point.color} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Scene
const GlobeScene: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#3b82f6" />
      
      <Earth />
      <DataPoints cells={cells} />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.5}
        dampingFactor={0.1}
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
  const hasData = coverageData.length > 0 || totalDataPoints > 0;

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      {/* Stats at TOP - always visible */}
      <div className="relative z-20 px-4 pt-2 pb-3">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Live Network</span>
            </div>
            <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
              Community Data
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center py-2 px-2 rounded-xl bg-slate-50">
              <p className="text-xl font-bold text-primary tabular-nums">
                {totalDataPoints.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Data Points</p>
            </div>
            <div className="text-center py-2 px-2 rounded-xl bg-slate-50">
              <p className="text-xl font-bold text-slate-800 tabular-nums">
                {uniqueLocations.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Locations</p>
            </div>
            <div className="text-center py-2 px-2 rounded-xl bg-slate-50">
              <p className="text-xl font-bold text-slate-800 tabular-nums">
                {coverageAreaKm2.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">km² Covered</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span className="text-[10px] text-slate-500">5G</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[10px] text-slate-500">LTE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-slate-500">3G</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Globe - takes remaining space */}
      <div className="flex-1 relative min-h-[300px]">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <GlobeScene cells={coverageData} />
          </Suspense>
        </Canvas>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
              <p className="text-sm text-slate-600 font-medium">Loading network data...</p>
            </div>
          </div>
        )}

        {/* Empty state overlay */}
        {!loading && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center px-6 py-5 rounded-2xl bg-white/80 backdrop-blur-lg border border-slate-200 mx-4 shadow-lg">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">No Data Yet</h3>
              <p className="text-sm text-slate-500">
                Start scanning to add your data!
              </p>
            </div>
          </div>
        )}
        
        {/* Motivational message */}
        {hasData && !loading && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-slate-700 font-medium">
                Join {uniqueLocations > 1 ? `${uniqueLocations} locations` : 'the network'}!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkGlobe;
