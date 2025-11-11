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

    // Camera - positioned further back for smaller globe
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);
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

    // Glowy wireframe globe (bigger)
    const globeRadius = 2.0;
    const geometry = new THREE.SphereGeometry(globeRadius, 48, 48);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#0ea5e9'),
      emissive: new THREE.Color('#06b6d4'),
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeRef.current = globe;

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius + 0.15, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#06b6d4'),
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Add latitude lines (parallels)
    const latLines: THREE.Line[] = [];
    for (let lat = -80; lat <= 80; lat += 20) {
      const phi = (90 - lat) * (Math.PI / 180);
      const points = [];
      
      for (let lon = 0; lon <= 360; lon += 5) {
        const theta = lon * (Math.PI / 180);
        const x = (globeRadius + 0.02) * Math.sin(phi) * Math.cos(theta);
        const y = (globeRadius + 0.02) * Math.cos(phi);
        const z = (globeRadius + 0.02) * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#06b6d4'),
        transparent: true,
        opacity: 0.15,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      latLines.push(line);
    }

    // Add longitude lines (meridians)
    const lonLines: THREE.Line[] = [];
    for (let lon = 0; lon < 360; lon += 20) {
      const theta = lon * (Math.PI / 180);
      const points = [];
      
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const x = (globeRadius + 0.02) * Math.sin(phi) * Math.cos(theta);
        const y = (globeRadius + 0.02) * Math.cos(phi);
        const z = (globeRadius + 0.02) * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#06b6d4'),
        transparent: true,
        opacity: 0.15,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      lonLines.push(line);
    }

    // Major continent/city positions (approximate lat/long)
    const locations = [
      { lat: 40.7, lon: -74.0, name: 'North America' },    // New York
      { lat: 51.5, lon: -0.1, name: 'Europe' },            // London
      { lat: 35.7, lon: 139.7, name: 'Asia East' },        // Tokyo
      { lat: -33.9, lon: 18.4, name: 'Africa' },           // Cape Town
      { lat: -33.9, lon: 151.2, name: 'Australia' },       // Sydney
      { lat: -23.5, lon: -46.6, name: 'South America' },   // Sao Paulo
      { lat: 55.8, lon: 37.6, name: 'Russia' },            // Moscow
      { lat: 1.3, lon: 103.8, name: 'Asia Southeast' },    // Singapore
      { lat: 19.4, lon: -99.1, name: 'Central America' },  // Mexico City
      { lat: 28.6, lon: 77.2, name: 'India' },             // Delhi
    ];

    // Convert to 3D positions
    const locationPoints = locations.map(loc => {
      const phi = (90 - loc.lat) * (Math.PI / 180);
      const theta = (loc.lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        globeRadius * Math.sin(phi) * Math.cos(theta),
        globeRadius * Math.cos(phi),
        globeRadius * Math.sin(phi) * Math.sin(theta)
      );
    });

    // Create connection lines between continents with particles - many more connections
    const connectionLines: THREE.Line[] = [];
    const particles: Array<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }> = [];
    const connections = [
      [0, 1], [1, 2], [1, 6], [2, 7], [3, 5], 
      [4, 7], [0, 8], [8, 5], [6, 9], [7, 9],
      [0, 6], [1, 3], [2, 9], [5, 3], [4, 2],
      [0, 2], [0, 4], [0, 9], [1, 7], [1, 9],
      [2, 3], [2, 5], [3, 6], [3, 9], [4, 5],
      [4, 6], [5, 7], [6, 8], [7, 8], [8, 9]
    ];
    
    connections.forEach(([i, j]) => {
      const start = locationPoints[i];
      const end = locationPoints[j];
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(globeRadius + 0.45); // Arc outward
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const curvePoints = curve.getPoints(40);
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#a855f7'),
        transparent: true,
        opacity: 0.3,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      connectionLines.push(line);

      // Add 2-3 particles per line with faster speeds
      for (let p = 0; p < 2; p++) {
        const particleGeometry = new THREE.SphereGeometry(0.02, 16, 16);
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#e879f9'),
          transparent: true,
          opacity: 0.5,
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        scene.add(particle);
        particles.push({
          mesh: particle,
          curve: curve,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.007,
        });
      }
    });

    // Add glowing dots at major locations with pulse speeds
    const dotGeometry = new THREE.SphereGeometry(0.035, 16, 16);
    const dots: Array<{ mesh: THREE.Mesh; pulseSpeed: number; baseScale: number }> = [];
    locationPoints.forEach((point, i) => {
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#06b6d4'),
        transparent: true,
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.copy(point);
      scene.add(dot);
      dots.push({
        mesh: dot,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        baseScale: 1.0,
      });
    });

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
      
      const time = Date.now() * 0.001;
      
      // Auto-rotate globe
      if (autoRotateRef.current && globeRef.current) {
        globeRef.current.rotation.y += 0.002;
      }

      // Pulse dots with different speeds
      dots.forEach(dotData => {
        const scale = 1.0 + Math.sin(time * dotData.pulseSpeed) * 0.3;
        dotData.mesh.scale.set(scale, scale, scale);
        const material = dotData.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.7 + Math.sin(time * dotData.pulseSpeed) * 0.3;
      });

      // Move particles along curves
      particles.forEach(particleData => {
        particleData.progress += particleData.speed;
        if (particleData.progress > 1) particleData.progress = 0;
        const point = particleData.curve.getPoint(particleData.progress);
        particleData.mesh.position.copy(point);
      });

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
      [...latLines, ...lonLines, ...connectionLines].forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      dots.forEach(dotData => {
        dotData.mesh.geometry.dispose();
        (dotData.mesh.material as THREE.Material).dispose();
      });
      particles.forEach(particleData => {
        particleData.mesh.geometry.dispose();
        (particleData.mesh.material as THREE.Material).dispose();
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-[200px] md:h-[280px] lg:h-[320px]">
      <div ref={containerRef} className="absolute inset-0 translate-x-8 translate-y-10 md:translate-x-0 md:translate-y-0" />
      {/* Subtle overlay gradient to match theme */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10" />
    </div>
  );
};

export default InteractiveGlobe;
