import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const MiniGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
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

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3);
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
    keyLight.position.set(3, 3, 3);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xb388ff, 0.6);
    rimLight.position.set(-3, -3, -3);
    scene.add(rimLight);

    // Small wireframe globe
    const globeRadius = 0.8;
    const geometry = new THREE.SphereGeometry(globeRadius, 32, 32);
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
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius + 0.08, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#06b6d4'),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Add latitude lines
    const latLines: THREE.Line[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * (Math.PI / 180);
      const points = [];
      
      for (let lon = 0; lon <= 360; lon += 10) {
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
      latLines.push(line);
    }

    // Add longitude lines
    const lonLines: THREE.Line[] = [];
    for (let lon = 0; lon < 360; lon += 30) {
      const theta = lon * (Math.PI / 180);
      const points = [];
      
      for (let lat = -90; lat <= 90; lat += 10) {
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
      lonLines.push(line);
    }

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
      
      // Auto-rotate globe
      if (autoRotateRef.current && globeRef.current) {
        globeRef.current.rotation.y += 0.003;
        globeRef.current.rotation.x = Math.sin(Date.now() * 0.0002) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current!);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      atmosphereGeometry.dispose();
      material.dispose();
      atmosphereMaterial.dispose();
      [...latLines, ...lonLines].forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" />
  );
};

export default MiniGlobe;
