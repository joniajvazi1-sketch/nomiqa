import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const InteractiveGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const isDraggingRef = useRef(false);
  const prevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);
  const frameIdRef = useRef<number>();
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera - moved further back to show full globe
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);
    cameraRef.current = camera;

    // Renderer (transparent background)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // fully transparent
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0x88ccff, 1.2);
    keyLight.position.set(6, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xb388ff, 0.6);
    rimLight.position.set(-6, -6, -6);
    scene.add(rimLight);

    // Glowy wireframe globe (smaller)
    const geometry = new THREE.SphereGeometry(1.5, 48, 48);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#0ea5e9'),
      emissive: new THREE.Color('#06b6d4'),
      emissiveIntensity: 0.4,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeRef.current = globe;

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.65, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#06b6d4'),
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create connection lines between random points
    const connectionLines: THREE.Line[] = [];
    const numConnections = 20;
    
    for (let i = 0; i < numConnections; i++) {
      const points = [];
      
      // Random start point on sphere
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.acos(2 * Math.random() - 1);
      const x1 = 1.5 * Math.sin(phi1) * Math.cos(theta1);
      const y1 = 1.5 * Math.sin(phi1) * Math.sin(theta1);
      const z1 = 1.5 * Math.cos(phi1);
      
      // Random end point on sphere
      const theta2 = Math.random() * Math.PI * 2;
      const phi2 = Math.acos(2 * Math.random() - 1);
      const x2 = 1.5 * Math.sin(phi2) * Math.cos(theta2);
      const y2 = 1.5 * Math.sin(phi2) * Math.sin(theta2);
      const z2 = 1.5 * Math.cos(phi2);
      
      // Create curved line (arc through space)
      const start = new THREE.Vector3(x1, y1, z1);
      const end = new THREE.Vector3(x2, y2, z2);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(1.8); // Arc outward
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const curvePoints = curve.getPoints(30);
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#a855f7'),
        transparent: true,
        opacity: 0.6,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      connectionLines.push(line);
    }

    // Add glowing dots at connection points
    const dotGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    for (let i = 0; i < 30; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = 1.5 * Math.sin(phi) * Math.cos(theta);
      const y = 1.5 * Math.sin(phi) * Math.sin(theta);
      const z = 1.5 * Math.cos(phi);
      
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? new THREE.Color('#06b6d4') : new THREE.Color('#a855f7'),
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.set(x, y, z);
      scene.add(dot);
    }

    // Drag controls (simple custom)
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      autoRotateRef.current = false;
      prevPosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !globeRef.current) return;
      const deltaX = e.clientX - prevPosRef.current.x;
      const deltaY = e.clientY - prevPosRef.current.y;
      globeRef.current.rotation.y += deltaX * 0.01;
      globeRef.current.rotation.x += deltaY * 0.01;
      prevPosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
      // resume gentle auto-rotate after a short moment
      setTimeout(() => (autoRotateRef.current = true), 800);
    };


    const container = containerRef.current;
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize handling
    const onResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animate
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      if (autoRotateRef.current && globeRef.current) {
        globeRef.current.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current!);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      geometry.dispose();
      atmosphereGeometry.dispose();
      dotGeometry.dispose();
      material.dispose();
      atmosphereMaterial.dispose();
      connectionLines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] md:h-[480px] lg:h-[560px]">
      <div ref={containerRef} className="absolute inset-0" />
      {/* Subtle overlay gradient to match theme */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10" />
    </div>
  );
};

export default InteractiveGlobe;
