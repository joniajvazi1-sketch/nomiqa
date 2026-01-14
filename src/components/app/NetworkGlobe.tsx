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

// Network type to color mapping
const getNetworkColor = (network: string): THREE.Color => {
  switch (network) {
    case '5g': return new THREE.Color(0x00d4ff); // Cyan for 5G
    case 'lte': return new THREE.Color(0x3b82f6); // Blue for LTE
    case '3g': return new THREE.Color(0xfbbf24); // Amber for 3G
    default: return new THREE.Color(0x8b5cf6); // Purple for other
  }
};

// Rotating Earth component
const Earth: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>
      <meshStandardMaterial
        color="#1e3a5f"
        roughness={0.8}
        metalness={0.2}
        wireframe={false}
      />
      {/* Grid lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.SphereGeometry(2.01, 24, 24)]} />
        <lineBasicMaterial color="#3b82f6" opacity={0.15} transparent />
      </lineSegments>
    </Sphere>
  );
};

// Atmospheric glow
const Atmosphere: React.FC = () => {
  return (
    <Sphere args={[2.15, 64, 64]}>
      <meshStandardMaterial
        color="#60a5fa"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
      />
    </Sphere>
  );
};

// Data points on the globe
const DataPoints: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, colors, sizes } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    
    cells.forEach((cell) => {
      const pos = latLngToVector3(cell.lat, cell.lng, 2.05);
      positions.push(pos.x, pos.y, pos.z);
      
      const color = getNetworkColor(cell.network);
      colors.push(color.r, color.g, color.b);
      
      // Size based on intensity and count
      const baseSize = 0.03 + (cell.intensity * 0.05);
      const countBonus = Math.min(cell.count / 100, 0.05);
      sizes.push(baseSize + countBonus);
    });
    
    return { positions, colors, sizes };
  }, [cells]);
  
  useFrame((state) => {
    if (pointsRef.current && pointsRef.current.material) {
      // Gentle pulse animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      const material = pointsRef.current.material as THREE.PointsMaterial;
      if (material.size !== undefined) {
        material.size = 0.08 * scale;
      }
    }
  });

  if (cells.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={new Float32Array(positions)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={new Float32Array(colors)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Glowing connection arcs (decorative)
const ConnectionArcs: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  const arcsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (arcsRef.current) {
      arcsRef.current.rotation.y += 0.0005;
    }
  });

  // Create a few random arcs between nearby points
  const arcs = useMemo(() => {
    if (cells.length < 2) return [];
    
    const arcData: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const maxArcs = Math.min(10, Math.floor(cells.length / 2));
    
    for (let i = 0; i < maxArcs; i++) {
      const idx1 = Math.floor(Math.random() * cells.length);
      const idx2 = Math.floor(Math.random() * cells.length);
      if (idx1 !== idx2) {
        arcData.push({
          start: latLngToVector3(cells[idx1].lat, cells[idx1].lng, 2.05),
          end: latLngToVector3(cells[idx2].lat, cells[idx2].lng, 2.05),
        });
      }
    }
    
    return arcData;
  }, [cells]);

  // Pre-calculate geometries for arcs
  const arcGeometries = useMemo(() => {
    return arcs.map((arc) => {
      const midPoint = new THREE.Vector3()
        .addVectors(arc.start, arc.end)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(2.5);
      
      const curve = new THREE.QuadraticBezierCurve3(arc.start, midPoint, arc.end);
      const points = curve.getPoints(20);
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, [arcs]);

  return (
    <group ref={arcsRef}>
      {arcGeometries.map((geometry, i) => (
        <primitive key={i} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x60a5fa, opacity: 0.3, transparent: true }))} />
      ))}
    </group>
  );
};

// Scene wrapper
const GlobeScene: React.FC<{ cells: GlobalCoverageCell[] }> = ({ cells }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#60a5fa" />
      
      <Stars radius={100} depth={50} count={1000} factor={2} fade speed={0.5} />
      
      <Earth />
      <Atmosphere />
      <DataPoints cells={cells} />
      <ConnectionArcs cells={cells} />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
};

// Loading state
const GlobeLoader: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">Loading global coverage...</p>
    </div>
  </div>
);

// Empty state
const GlobeEmptyState: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center px-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="font-semibold text-foreground mb-1">No coverage data yet</h3>
      <p className="text-sm text-muted-foreground">Be the first to contribute and see your data appear here!</p>
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
  const hasData = coverageData.length > 0;

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-background to-background/95">
      {/* 3D Globe Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <GlobeScene cells={coverageData} />
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      {loading && <GlobeLoader />}

      {/* Empty state */}
      {!loading && !hasData && <GlobeEmptyState />}

      {/* Stats overlay - floating at bottom */}
      {hasData && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-card/80 backdrop-blur-md rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-foreground">Live Network</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Community Data</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-lg font-bold text-primary tabular-nums">
                  {totalDataPoints.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">Data Points</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {uniqueLocations.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">Locations</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {coverageAreaKm2.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">km² Covered</p>
              </div>
            </div>

            {/* Network type legend */}
            <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[10px] text-muted-foreground">5G</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-muted-foreground">LTE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-muted-foreground">3G</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGlobe;
