import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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

// Network type to color mapping - vibrant colors
const getNetworkColor = (network: string): THREE.Color => {
  switch (network) {
    case '5g': return new THREE.Color(0x00ffff); // Cyan for 5G
    case 'lte': return new THREE.Color(0x4da6ff); // Blue for LTE
    case '3g': return new THREE.Color(0xffcc00); // Gold for 3G
    default: return new THREE.Color(0xff66ff); // Magenta for other
  }
};

// Earth with grid overlay - Light theme friendly
const Earth: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0008;
    }
    if (gridRef.current) {
      gridRef.current.rotation.y += 0.0008;
    }
  });

  return (
    <group>
      {/* Main sphere - Light blue for visibility */}
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#e0f2fe"
          roughness={0.6}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Grid overlay */}
      <lineSegments ref={gridRef}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(2.01, 2)]} />
        <lineBasicMaterial color="#0ea5e9" opacity={0.3} transparent />
      </lineSegments>
      
      {/* Latitude lines */}
      {[-60, -30, 0, 30, 60].map((lat, i) => (
        <mesh key={`lat-${i}`} rotation={[Math.PI / 2, 0, 0]} position={[0, Math.sin(lat * Math.PI / 180) * 2, 0]}>
          <ringGeometry args={[Math.cos(lat * Math.PI / 180) * 2 - 0.002, Math.cos(lat * Math.PI / 180) * 2, 64]} />
          <meshBasicMaterial color="#0ea5e9" opacity={0.2} transparent side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// Outer glow atmosphere - Subtle blue
const Atmosphere: React.FC = () => {
  return (
    <>
      <Sphere args={[2.08, 64, 64]}>
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      <Sphere args={[2.2, 32, 32]}>
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>
    </>
  );
};

// Animated data points
const DataPoints: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const pointsData = useMemo(() => {
    return cells.map((cell) => ({
      position: latLngToVector3(cell.lat, cell.lng, 2.03),
      color: getNetworkColor(cell.network),
      size: 0.015 + Math.min(cell.count / 50, 0.03) + (cell.intensity * 0.02),
      intensity: cell.intensity,
      network: cell.network,
    }));
  }, [cells]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008;
    }
  });

  if (cells.length === 0) return null;

  return (
    <group ref={groupRef}>
      {pointsData.map((point, i) => (
        <mesh key={i} position={point.position}>
          <sphereGeometry args={[point.size, 8, 8]} />
          <meshBasicMaterial 
            color={point.color} 
            transparent 
            opacity={0.9}
          />
          {/* Glow effect */}
          <mesh>
            <sphereGeometry args={[point.size * 2, 8, 8]} />
            <meshBasicMaterial 
              color={point.color} 
              transparent 
              opacity={0.2}
            />
          </mesh>
        </mesh>
      ))}
    </group>
  );
};

// Decorative connection beams
const ConnectionBeams: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
  });

  const beams = useMemo(() => {
    if (cells.length < 2) return [];
    
    const beamData: THREE.BufferGeometry[] = [];
    const beamCount = Math.min(8, Math.floor(cells.length / 2));
    
    const shuffled = [...cells].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < beamCount && i * 2 + 1 < shuffled.length; i++) {
      const start = latLngToVector3(shuffled[i * 2].lat, shuffled[i * 2].lng, 2.04);
      const end = latLngToVector3(shuffled[i * 2 + 1].lat, shuffled[i * 2 + 1].lng, 2.04);
      
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(2.6);
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(30);
      beamData.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    
    return beamData;
  }, [cells]);

  const lineObjects = useMemo(() => {
    return beams.map((geometry) => {
      return new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: 0x60a5fa, opacity: 0.25, transparent: true })
      );
    });
  }, [beams]);

  if (lineObjects.length === 0) return null;

  return (
    <group ref={groupRef}>
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
};

// Scene composition - Light theme
const GlobeScene: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#0ea5e9" />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      
      {/* Subtle star field - lighter */}
      <Stars 
        radius={80} 
        depth={50} 
        count={500} 
        factor={2} 
        saturation={0.1} 
        fade 
        speed={0.2} 
      />
      
      <Earth />
      <Atmosphere />
      <DataPoints cells={cells} />
      <ConnectionBeams cells={cells} />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={7}
        autoRotate
        autoRotateSpeed={0.2}
        dampingFactor={0.05}
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
  const hasData = coverageData.length > 0;

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-sky-50 via-white to-slate-50">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <GlobeScene cells={coverageData} />
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-primary/20 border-b-primary/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Loading network data...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center px-8 py-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-white/10 mx-4">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Coverage Data Yet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Be the first contributor!<br />
              Start scanning to see your data appear here.
            </p>
          </div>
        </div>
      )}

      {/* Stats panel */}
      {hasData && !loading && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <div className="bg-card/70 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
                </div>
                <span className="text-sm font-semibold text-foreground">Live Network</span>
              </div>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">
                Community Data
              </span>
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center py-2 px-3 rounded-xl bg-white/5">
                <p className="text-xl font-bold text-primary tabular-nums">
                  {totalDataPoints.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Data Points</p>
              </div>
              <div className="text-center py-2 px-3 rounded-xl bg-white/5">
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {uniqueLocations.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Locations</p>
              </div>
              <div className="text-center py-2 px-3 rounded-xl bg-white/5">
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {coverageAreaKm2.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">km² Covered</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/30" />
                <span className="text-xs text-muted-foreground">5G</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/30" />
                <span className="text-xs text-muted-foreground">LTE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/30" />
                <span className="text-xs text-muted-foreground">3G</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGlobe;
