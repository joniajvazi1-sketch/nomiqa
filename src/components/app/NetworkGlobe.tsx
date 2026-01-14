import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
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

// Helium-style color palette
const getNetworkColor = (network: string): THREE.Color => {
  switch (network) {
    case '5g': return new THREE.Color(0x00ffa3); // Bright green
    case 'lte': return new THREE.Color(0x00d4ff); // Cyan
    case '3g': return new THREE.Color(0xa855f7); // Purple
    default: return new THREE.Color(0x00d4ff); // Default cyan
  }
};

// Dark Earth with Helium aesthetic
const Earth: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core dark sphere */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#0a1628"
          roughness={0.9}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Subtle grid overlay */}
      <Sphere args={[2.01, 36, 36]}>
        <meshBasicMaterial
          color="#1e3a5f"
          wireframe
          transparent
          opacity={0.12}
        />
      </Sphere>
      
      {/* Atmosphere glow */}
      <Sphere args={[2.08, 64, 64]}>
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

// Individual glowing hotspot
const Hotspot: React.FC<{ position: THREE.Vector3; color: THREE.Color; intensity: number }> = ({ 
  position, 
  color, 
  intensity 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseSpeed = useRef(Math.random() * 2 + 1);
  
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed.current) * 0.3 + 0.7;
      meshRef.current.scale.setScalar(pulse * intensity);
      glowRef.current.scale.setScalar(pulse * 1.8 * intensity);
    }
  });

  return (
    <group position={position}>
      {/* Core bright point */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

// Data points as glowing hotspots
const DataHotspots: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const hotspots = useMemo(() => {
    // Deduplicate by rounding coordinates
    const seen = new Set<string>();
    return cells
      .filter(cell => {
        const key = `${cell.lat.toFixed(1)},${cell.lng.toFixed(1)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 400)
      .map((cell, i) => ({
        id: i,
        position: latLngToVector3(cell.lat, cell.lng, 2.05),
        color: getNetworkColor(cell.network),
        intensity: 0.6 + Math.min(cell.count / 20, 0.4),
      }));
  }, [cells]);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  if (hotspots.length === 0) return null;

  return (
    <group ref={groupRef}>
      {hotspots.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          position={hotspot.position}
          color={hotspot.color}
          intensity={hotspot.intensity}
        />
      ))}
    </group>
  );
};

// Scene with dark space atmosphere
const GlobeScene: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#00d4ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#a855f7" />
      
      <Stars
        radius={100}
        depth={50}
        count={1500}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />
      
      <Earth />
      <DataHotspots cells={cells} />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.4}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
};

// Main component with Helium-style UI
export const NetworkGlobe: React.FC<NetworkGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
  coverageAreaKm2 = 0,
}) => {
  const hasData = coverageData.length > 0 || totalDataPoints > 0;

  return (
    <div className="relative w-full h-full bg-[#0a0f1a] rounded-2xl overflow-hidden">
      {/* Top header - Helium style */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3">
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
              <span>5G</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
              <span>LTE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
              <span>3G</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row - positioned at top */}
      <div className="absolute top-12 left-0 right-0 z-20 px-3">
        <div className="flex justify-center gap-2">
          <div className="flex-1 max-w-[100px] bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[#00d4ff] text-base font-bold tabular-nums">
              {totalDataPoints.toLocaleString()}
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Points</div>
          </div>
          <div className="flex-1 max-w-[100px] bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[#00ffa3] text-base font-bold tabular-nums">
              {uniqueLocations.toLocaleString()}
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Hotspots</div>
          </div>
          <div className="flex-1 max-w-[100px] bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[#a855f7] text-base font-bold tabular-nums">
              {coverageAreaKm2.toFixed(0)}
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">km²</div>
          </div>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <GlobeScene cells={coverageData} />
          </Suspense>
        </Canvas>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1a]/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
            <span className="text-[#00d4ff] text-sm font-medium">Loading network...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center px-6 py-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 mx-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#00d4ff]/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-[#00d4ff] border-dashed animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">No Data Yet</h3>
            <p className="text-xs text-white/50">
              Start scanning to contribute!
            </p>
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0f1a] to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default NetworkGlobe;
