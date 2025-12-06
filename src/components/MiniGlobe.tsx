import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Detect mobile device
const isMobile = () => {
  return typeof window !== 'undefined' && (
    window.innerWidth < 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

const MiniGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
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
      { threshold: 0.01, rootMargin: '50px' }
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

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3);

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
    keyLight.position.set(3, 3, 3);
    scene.add(keyLight);

    // Wireframe globe (reduced segments on mobile)
    const globeRadius = 0.8;
    const segments = mobile ? 20 : 32;
    const geometry = new THREE.SphereGeometry(globeRadius, segments, segments);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#0ea5e9'),
      emissive: new THREE.Color('#06b6d4'),
      emissiveIntensity: 0.5,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeRef.current = globe;

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius + 0.08, segments, segments);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#06b6d4'),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Grid lines (reduced on mobile)
    const linesToCleanup: THREE.Line[] = [];
    const latStep = mobile ? 60 : 30;
    const lonStep = mobile ? 60 : 30;

    for (let lat = -60; lat <= 60; lat += latStep) {
      const phi = (90 - lat) * (Math.PI / 180);
      const points = [];
      
      for (let lon = 0; lon <= 360; lon += 15) {
        const theta = lon * (Math.PI / 180);
        const x = (globeRadius + 0.01) * Math.sin(phi) * Math.cos(theta);
        const y = (globeRadius + 0.01) * Math.cos(phi);
        const z = (globeRadius + 0.01) * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#06b6d4'),
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      linesToCleanup.push(line);
    }

    for (let lon = 0; lon < 360; lon += lonStep) {
      const theta = lon * (Math.PI / 180);
      const points = [];
      
      for (let lat = -90; lat <= 90; lat += 15) {
        const phi = (90 - lat) * (Math.PI / 180);
        const x = (globeRadius + 0.01) * Math.sin(phi) * Math.cos(theta);
        const y = (globeRadius + 0.01) * Math.cos(phi);
        const z = (globeRadius + 0.01) * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#06b6d4'),
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      linesToCleanup.push(line);
    }

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
      
      // Auto-rotate globe
      if (globeRef.current) {
        globeRef.current.rotation.y += 0.003;
        globeRef.current.rotation.x = Math.sin(Date.now() * 0.0002) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current!);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      atmosphereGeometry.dispose();
      material.dispose();
      atmosphereMaterial.dispose();
      linesToCleanup.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="absolute inset-0" />
  );
};

export default MiniGlobe;
