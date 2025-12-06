import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Detect mobile device
const isMobile = () => {
  return typeof window !== 'undefined' && (
    window.innerWidth < 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

const InteractiveGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const isDraggingRef = useRef(false);
  const prevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);
  const frameIdRef = useRef<number>();
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isVisibleRef = useRef(false);
  const isPausedRef = useRef(false);
  const isInitializedRef = useRef(false);
  const [isInView, setIsInView] = useState(false);

  // Lazy initialization with IntersectionObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.01, rootMargin: '100px' }
    );
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !containerRef.current || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    const container = containerRef.current;
    const mobile = isMobile();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera - positioned further back for smaller globe
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // Renderer with optimized settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !mobile, 
      alpha: true,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
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

    // Glowy wireframe globe (reduced segments on mobile)
    const globeRadius = 2.0;
    const segments = mobile ? 24 : 48;
    const geometry = new THREE.SphereGeometry(globeRadius, segments, segments);
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
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius + 0.15, segments, segments);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#06b6d4'),
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Grid lines (reduced on mobile)
    const latLines: THREE.Line[] = [];
    const latStep = mobile ? 40 : 20;
    for (let lat = -80; lat <= 80; lat += latStep) {
      const phi = (90 - lat) * (Math.PI / 180);
      const points = [];
      
      for (let lon = 0; lon <= 360; lon += 10) {
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

    // Longitude lines (reduced on mobile)
    const lonLines: THREE.Line[] = [];
    const lonStep = mobile ? 40 : 20;
    for (let lon = 0; lon < 360; lon += lonStep) {
      const theta = lon * (Math.PI / 180);
      const points = [];
      
      for (let lat = -90; lat <= 90; lat += 10) {
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

    // Major locations (reduced set for connections)
    const locations = [
      { lat: 40.7, lon: -74.0 },    // New York
      { lat: 51.5, lon: -0.1 },     // London
      { lat: 35.7, lon: 139.7 },    // Tokyo
      { lat: -33.9, lon: 18.4 },    // Cape Town
      { lat: -33.9, lon: 151.2 },   // Sydney
      { lat: 1.3, lon: 103.8 },     // Singapore
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

    // Connection lines (reduced: 8 connections instead of 30)
    const connectionLines: THREE.Line[] = [];
    const particles: Array<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }> = [];
    const connections = mobile 
      ? [[0, 1], [1, 2], [2, 5], [3, 4]] 
      : [[0, 1], [1, 2], [2, 5], [3, 4], [0, 2], [1, 5], [4, 5], [0, 3]];
    
    connections.forEach(([i, j]) => {
      const start = locationPoints[i];
      const end = locationPoints[j];
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(globeRadius + 0.45);
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const curvePoints = curve.getPoints(30);
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#a855f7'),
        transparent: true,
        opacity: 0.3,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      connectionLines.push(line);

      // One particle per line (reduced from 2-3)
      const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
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
        speed: 0.005 + Math.random() * 0.005,
      });
    });

    // Location dots
    const dotGeometry = new THREE.SphereGeometry(0.035, 8, 8);
    const dots: Array<{ mesh: THREE.Mesh; pulseSpeed: number }> = [];
    locationPoints.forEach((point) => {
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
      });
    });

    // Drag controls
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
      setTimeout(() => (autoRotateRef.current = true), 800);
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Visibility change handler
    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Resize handling
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animate
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Skip rendering if paused or not visible
      if (isPausedRef.current || !isVisibleRef.current) {
        return;
      }
      
      const time = Date.now() * 0.001;
      
      // Auto-rotate globe
      if (autoRotateRef.current && globeRef.current) {
        globeRef.current.rotation.y += 0.002;
      }

      // Pulse dots
      dots.forEach(dotData => {
        const scale = 1.0 + Math.sin(time * dotData.pulseSpeed) * 0.3;
        dotData.mesh.scale.set(scale, scale, scale);
        const mat = dotData.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.7 + Math.sin(time * dotData.pulseSpeed) * 0.3;
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
      document.removeEventListener('visibilitychange', handleVisibility);
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isInView]);

  return (
    <div className="relative w-full h-[200px] md:h-[280px] lg:h-[320px]">
      <div ref={containerRef} className="absolute inset-0 translate-x-10 translate-y-8 md:translate-x-0 md:translate-y-0" />
      {/* Subtle overlay gradient to match theme */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10" />
    </div>
  );
};

export default InteractiveGlobe;
