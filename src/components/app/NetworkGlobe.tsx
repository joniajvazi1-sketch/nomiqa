import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GlobalCoverageCell } from '@/hooks/useGlobalCoverage';

interface NetworkGlobeProps {
  coverageData: GlobalCoverageCell[];
  loading?: boolean;
  totalDataPoints?: number;
  uniqueLocations?: number;
  coverageAreaKm2?: number;
  isPersonalView?: boolean; // Start zoomed in for personal view
  userPosition?: [number, number] | null; // User's current position
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

// Ultra-realistic Earth with NASA textures
const Earth: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const nightRef = useRef<THREE.Mesh>(null);
  
  // Load high-quality NASA textures - using reliable URLs
  const dayTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg');
  const bumpTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png');
  const specularTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png');
  const nightTexture = useLoader(THREE.TextureLoader, 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg');
  
  // Improve texture quality
  [dayTexture, bumpTexture, specularTexture, nightTexture].forEach(tex => {
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.00015;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Earth sphere with photorealistic PBR material */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 128, 128]} />
        <meshPhongMaterial
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.015}
          specularMap={specularTexture}
          specular={new THREE.Color(0x333333)}
          shininess={25}
        />
      </mesh>
      
      {/* Night side with city lights - blended additively */}
      <mesh ref={nightRef}>
        <sphereGeometry args={[1.501, 128, 128]} />
        <meshBasicMaterial
          map={nightTexture}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Simulated cloud layer - no external texture needed */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.52, 64, 64]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner atmosphere - Rayleigh scattering */}
      <Sphere args={[1.55, 64, 64]}>
        <meshBasicMaterial
          color="#6ab7ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Outer atmosphere glow - Fresnel effect */}
      <Sphere args={[1.65, 64, 64]}>
        <meshBasicMaterial
          color="#4d9fff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Faint haze */}
      <Sphere args={[1.75, 64, 64]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.02}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

interface DataPointMarker {
  lat: number;
  lng: number;
  count: number;
  position: THREE.Vector3;
  intensity: number;
  cityName: string; // Approximate city/region name
}

// Get approximate city/region name from coordinates (privacy-respecting)
const getApproximateLocation = (lat: number, lng: number): string => {
  // Extensive list of major world cities mapped to approximate lat/lng ranges
  const cities: { name: string; lat: number; lng: number; radius: number }[] = [
    // Europe - Major cities
    { name: 'London', lat: 51.5, lng: -0.1, radius: 1.5 },
    { name: 'Paris', lat: 48.9, lng: 2.3, radius: 1.2 },
    { name: 'Berlin', lat: 52.5, lng: 13.4, radius: 1.2 },
    { name: 'Madrid', lat: 40.4, lng: -3.7, radius: 1.2 },
    { name: 'Rome', lat: 41.9, lng: 12.5, radius: 1.2 },
    { name: 'Amsterdam', lat: 52.4, lng: 4.9, radius: 1 },
    { name: 'Barcelona', lat: 41.4, lng: 2.2, radius: 1 },
    { name: 'Munich', lat: 48.1, lng: 11.6, radius: 1 },
    { name: 'Milan', lat: 45.5, lng: 9.2, radius: 1 },
    { name: 'Vienna', lat: 48.2, lng: 16.4, radius: 1 },
    { name: 'Prague', lat: 50.1, lng: 14.4, radius: 1 },
    { name: 'Brussels', lat: 50.8, lng: 4.4, radius: 0.8 },
    { name: 'Zurich', lat: 47.4, lng: 8.5, radius: 0.8 },
    { name: 'Stockholm', lat: 59.3, lng: 18.1, radius: 1 },
    { name: 'Gothenburg', lat: 57.7, lng: 12, radius: 1 },
    { name: 'Malmö', lat: 55.6, lng: 13, radius: 0.8 },
    { name: 'Uppsala', lat: 59.9, lng: 17.6, radius: 0.8 },
    { name: 'Copenhagen', lat: 55.7, lng: 12.6, radius: 0.8 },
    { name: 'Aarhus', lat: 56.2, lng: 10.2, radius: 0.8 },
    { name: 'Oslo', lat: 59.9, lng: 10.8, radius: 1 },
    { name: 'Bergen', lat: 60.4, lng: 5.3, radius: 1 },
    { name: 'Trondheim', lat: 63.4, lng: 10.4, radius: 0.8 },
    { name: 'Stavanger', lat: 59, lng: 5.7, radius: 0.8 },
    { name: 'Helsinki', lat: 60.2, lng: 24.9, radius: 1 },
    { name: 'Tampere', lat: 61.5, lng: 23.8, radius: 0.8 },
    { name: 'Turku', lat: 60.5, lng: 22.3, radius: 0.8 },
    { name: 'Reykjavik', lat: 64.1, lng: -21.9, radius: 1.5 },
    { name: 'Akureyri', lat: 65.7, lng: -18.1, radius: 0.8 },
    { name: 'Tromsø', lat: 69.6, lng: 19, radius: 0.8 },
    { name: 'Warsaw', lat: 52.2, lng: 21, radius: 1 },
    { name: 'Budapest', lat: 47.5, lng: 19.1, radius: 1 },
    { name: 'Lisbon', lat: 38.7, lng: -9.1, radius: 1 },
    { name: 'Dublin', lat: 53.3, lng: -6.3, radius: 1 },
    { name: 'Athens', lat: 37.98, lng: 23.7, radius: 1 },
    { name: 'Thessaloniki', lat: 40.6, lng: 22.9, radius: 1 },
    { name: 'Crete', lat: 35.2, lng: 24.9, radius: 1.5 },
    { name: 'Rhodes', lat: 36.4, lng: 28.2, radius: 0.8 },
    { name: 'Corfu', lat: 39.6, lng: 19.9, radius: 0.6 },
    { name: 'Santorini', lat: 36.4, lng: 25.4, radius: 0.5 },
    { name: 'Mykonos', lat: 37.4, lng: 25.3, radius: 0.5 },
    { name: 'Manchester', lat: 53.5, lng: -2.2, radius: 1 },
    { name: 'Birmingham', lat: 52.5, lng: -1.9, radius: 1 },
    { name: 'Frankfurt', lat: 50.1, lng: 8.7, radius: 1 },
    { name: 'Hamburg', lat: 53.5, lng: 10, radius: 1 },
    
    // Mediterranean
    { name: 'Naples', lat: 40.9, lng: 14.3, radius: 1.2 },
    { name: 'Palermo', lat: 38.1, lng: 13.4, radius: 1 },
    { name: 'Florence', lat: 43.8, lng: 11.2, radius: 1 },
    { name: 'Venice', lat: 45.4, lng: 12.3, radius: 0.8 },
    { name: 'Split', lat: 43.5, lng: 16.4, radius: 1 },
    { name: 'Dubrovnik', lat: 42.6, lng: 18.1, radius: 0.8 },
    { name: 'Nice', lat: 43.7, lng: 7.3, radius: 1 },
    { name: 'Marseille', lat: 43.3, lng: 5.4, radius: 1.2 },
    { name: 'Monaco', lat: 43.7, lng: 7.4, radius: 0.5 },
    { name: 'Cannes', lat: 43.6, lng: 7, radius: 0.6 },
    { name: 'Valencia', lat: 39.5, lng: -0.4, radius: 1.2 },
    { name: 'Malaga', lat: 36.7, lng: -4.4, radius: 1 },
    { name: 'Seville', lat: 37.4, lng: -6, radius: 1 },
    { name: 'Ibiza', lat: 38.9, lng: 1.4, radius: 0.6 },
    { name: 'Mallorca', lat: 39.6, lng: 2.6, radius: 1 },
    { name: 'Malta', lat: 35.9, lng: 14.4, radius: 0.8 },
    { name: 'Cyprus', lat: 35.2, lng: 33.4, radius: 1.2 },
    { name: 'Antalya', lat: 36.9, lng: 30.7, radius: 1.2 },
    { name: 'Bodrum', lat: 37, lng: 27.4, radius: 0.8 },
    
    // Russia
    { name: 'Moscow', lat: 55.8, lng: 37.6, radius: 2 },
    { name: 'St. Petersburg', lat: 59.9, lng: 30.3, radius: 1.5 },
    { name: 'Novosibirsk', lat: 55, lng: 82.9, radius: 1.2 },
    { name: 'Yekaterinburg', lat: 56.8, lng: 60.6, radius: 1.2 },
    { name: 'Kazan', lat: 55.8, lng: 49.1, radius: 1 },
    { name: 'Nizhny Novgorod', lat: 56.3, lng: 44, radius: 1 },
    { name: 'Samara', lat: 53.2, lng: 50.1, radius: 1 },
    { name: 'Rostov-on-Don', lat: 47.2, lng: 39.7, radius: 1 },
    { name: 'Vladivostok', lat: 43.1, lng: 131.9, radius: 1 },
    { name: 'Sochi', lat: 43.6, lng: 39.7, radius: 0.8 },
    
    // Central Asia
    { name: 'Almaty', lat: 43.2, lng: 76.9, radius: 1.5 },
    { name: 'Nur-Sultan', lat: 51.2, lng: 71.4, radius: 1.2 },
    { name: 'Tashkent', lat: 41.3, lng: 69.3, radius: 1.5 },
    { name: 'Bishkek', lat: 42.9, lng: 74.6, radius: 1 },
    { name: 'Dushanbe', lat: 38.6, lng: 68.8, radius: 1 },
    { name: 'Ashgabat', lat: 37.9, lng: 58.4, radius: 1 },
    { name: 'Baku', lat: 40.4, lng: 49.9, radius: 1.2 },
    { name: 'Tbilisi', lat: 41.7, lng: 44.8, radius: 1 },
    { name: 'Yerevan', lat: 40.2, lng: 44.5, radius: 1 },
    
    // Ukraine
    { name: 'Kyiv', lat: 50.4, lng: 30.5, radius: 2 },
    { name: 'Lviv', lat: 49.8, lng: 24, radius: 1.2 },
    { name: 'Odesa', lat: 46.5, lng: 30.7, radius: 1.2 },
    { name: 'Kharkiv', lat: 50, lng: 36.2, radius: 1.2 },
    { name: 'Dnipro', lat: 48.5, lng: 35, radius: 1 },
    { name: 'Zaporizhzhia', lat: 47.8, lng: 35.2, radius: 1 },
    
    // Eastern Europe
    { name: 'Minsk', lat: 53.9, lng: 27.6, radius: 1.5 },
    { name: 'Vilnius', lat: 54.7, lng: 25.3, radius: 1 },
    { name: 'Riga', lat: 56.9, lng: 24.1, radius: 1 },
    { name: 'Tallinn', lat: 59.4, lng: 24.7, radius: 1 },
    { name: 'Bucharest', lat: 44.4, lng: 26.1, radius: 1.5 },
    { name: 'Sofia', lat: 42.7, lng: 23.3, radius: 1.2 },
    { name: 'Belgrade', lat: 44.8, lng: 20.5, radius: 1.2 },
    { name: 'Zagreb', lat: 45.8, lng: 16, radius: 1 },
    { name: 'Ljubljana', lat: 46.1, lng: 14.5, radius: 0.8 },
    { name: 'Sarajevo', lat: 43.9, lng: 18.4, radius: 1 },
    { name: 'Skopje', lat: 42, lng: 21.4, radius: 1 },
    { name: 'Tirana', lat: 41.3, lng: 19.8, radius: 1 },
    { name: 'Chisinau', lat: 47, lng: 28.8, radius: 1 },
    { name: 'Bratislava', lat: 48.1, lng: 17.1, radius: 1 },
    { name: 'Krakow', lat: 50.1, lng: 19.9, radius: 1 },
    { name: 'Gdansk', lat: 54.4, lng: 18.6, radius: 1 },
    { name: 'Wroclaw', lat: 51.1, lng: 17, radius: 1 },
    
    // North America
    { name: 'New York', lat: 40.7, lng: -74, radius: 1.5 },
    { name: 'Los Angeles', lat: 34.1, lng: -118.2, radius: 2 },
    { name: 'Chicago', lat: 41.9, lng: -87.6, radius: 1.5 },
    { name: 'Toronto', lat: 43.7, lng: -79.4, radius: 1.5 },
    { name: 'San Francisco', lat: 37.8, lng: -122.4, radius: 1 },
    { name: 'Miami', lat: 25.8, lng: -80.2, radius: 1.2 },
    { name: 'Houston', lat: 29.8, lng: -95.4, radius: 1.5 },
    { name: 'Dallas', lat: 32.8, lng: -96.8, radius: 1.5 },
    { name: 'Atlanta', lat: 33.7, lng: -84.4, radius: 1.2 },
    { name: 'Boston', lat: 42.4, lng: -71.1, radius: 1 },
    { name: 'Seattle', lat: 47.6, lng: -122.3, radius: 1 },
    { name: 'Denver', lat: 39.7, lng: -105, radius: 1 },
    { name: 'Phoenix', lat: 33.4, lng: -112.1, radius: 1.2 },
    { name: 'Montreal', lat: 45.5, lng: -73.6, radius: 1 },
    { name: 'Vancouver', lat: 49.3, lng: -123.1, radius: 1 },
    { name: 'Washington DC', lat: 38.9, lng: -77, radius: 1 },
    { name: 'Philadelphia', lat: 40, lng: -75.2, radius: 1 },
    { name: 'San Diego', lat: 32.7, lng: -117.2, radius: 1 },
    { name: 'Mexico City', lat: 19.4, lng: -99.1, radius: 2 },
    { name: 'Guadalajara', lat: 20.7, lng: -103.3, radius: 1 },
    
    // Asia - Major cities
    { name: 'Tokyo', lat: 35.7, lng: 139.7, radius: 2 },
    { name: 'Singapore', lat: 1.3, lng: 103.8, radius: 1 },
    { name: 'Hong Kong', lat: 22.3, lng: 114.2, radius: 1 },
    { name: 'Seoul', lat: 37.6, lng: 127, radius: 1.5 },
    { name: 'Mumbai', lat: 19.1, lng: 72.9, radius: 1.5 },
    { name: 'Dubai', lat: 25.2, lng: 55.3, radius: 1.5 },
    { name: 'Shanghai', lat: 31.2, lng: 121.5, radius: 2 },
    { name: 'Beijing', lat: 39.9, lng: 116.4, radius: 2 },
    { name: 'Bangkok', lat: 13.8, lng: 100.5, radius: 1.5 },
    { name: 'Kuala Lumpur', lat: 3.1, lng: 101.7, radius: 1 },
    { name: 'Jakarta', lat: -6.2, lng: 106.8, radius: 2 },
    { name: 'Manila', lat: 14.6, lng: 121, radius: 1.5 },
    { name: 'Delhi', lat: 28.6, lng: 77.2, radius: 2 },
    { name: 'Bangalore', lat: 13, lng: 77.6, radius: 1.5 },
    { name: 'Chennai', lat: 13.1, lng: 80.3, radius: 1.2 },
    { name: 'Hyderabad', lat: 17.4, lng: 78.5, radius: 1.2 },
    { name: 'Osaka', lat: 34.7, lng: 135.5, radius: 1.5 },
    { name: 'Taipei', lat: 25, lng: 121.5, radius: 1 },
    { name: 'Ho Chi Minh City', lat: 10.8, lng: 106.6, radius: 1.5 },
    { name: 'Hanoi', lat: 21, lng: 105.8, radius: 1 },
    { name: 'Shenzhen', lat: 22.5, lng: 114.1, radius: 1.5 },
    { name: 'Guangzhou', lat: 23.1, lng: 113.3, radius: 1.5 },
    { name: 'Kolkata', lat: 22.6, lng: 88.4, radius: 1.5 },
    { name: 'Abu Dhabi', lat: 24.5, lng: 54.4, radius: 1 },
    { name: 'Doha', lat: 25.3, lng: 51.5, radius: 1 },
    { name: 'Riyadh', lat: 24.7, lng: 46.7, radius: 1.5 },
    { name: 'Tel Aviv', lat: 32.1, lng: 34.8, radius: 1 },
    { name: 'Istanbul', lat: 41, lng: 29, radius: 2 },
    
    // Africa
    { name: 'Cape Town', lat: -33.9, lng: 18.4, radius: 1.5 },
    { name: 'Cairo', lat: 30, lng: 31.2, radius: 2 },
    { name: 'Johannesburg', lat: -26.2, lng: 28, radius: 1.5 },
    { name: 'Lagos', lat: 6.5, lng: 3.4, radius: 2 },
    { name: 'Nairobi', lat: -1.3, lng: 36.8, radius: 1.5 },
    { name: 'Casablanca', lat: 33.6, lng: -7.6, radius: 1.5 },
    { name: 'Accra', lat: 5.6, lng: -0.2, radius: 1 },
    { name: 'Addis Ababa', lat: 9, lng: 38.7, radius: 1.5 },
    { name: 'Dar es Salaam', lat: -6.8, lng: 39.3, radius: 1 },
    { name: 'Durban', lat: -29.9, lng: 31, radius: 1 },
    { name: 'Algiers', lat: 36.8, lng: 3, radius: 1 },
    { name: 'Tunis', lat: 36.8, lng: 10.2, radius: 1 },
    { name: 'Marrakech', lat: 31.6, lng: -8, radius: 1 },
    
    // Australia & Oceania
    { name: 'Sydney', lat: -33.9, lng: 151.2, radius: 2 },
    { name: 'Melbourne', lat: -37.8, lng: 145, radius: 2 },
    { name: 'Brisbane', lat: -27.5, lng: 153, radius: 1.5 },
    { name: 'Perth', lat: -31.9, lng: 115.9, radius: 1.5 },
    { name: 'Auckland', lat: -36.8, lng: 174.8, radius: 1.5 },
    { name: 'Wellington', lat: -41.3, lng: 174.8, radius: 1 },
    
    // South America
    { name: 'São Paulo', lat: -23.5, lng: -46.6, radius: 2 },
    { name: 'Buenos Aires', lat: -34.6, lng: -58.4, radius: 2 },
    { name: 'Rio de Janeiro', lat: -22.9, lng: -43.2, radius: 1.5 },
    { name: 'Lima', lat: -12, lng: -77, radius: 1.5 },
    { name: 'Bogotá', lat: 4.7, lng: -74.1, radius: 1.5 },
    { name: 'Santiago', lat: -33.4, lng: -70.6, radius: 1.5 },
    { name: 'Caracas', lat: 10.5, lng: -66.9, radius: 1 },
    { name: 'Medellín', lat: 6.2, lng: -75.6, radius: 1 },
    { name: 'Montevideo', lat: -34.9, lng: -56.2, radius: 1 },
    { name: 'Quito', lat: -0.2, lng: -78.5, radius: 1 },
  ];
  
  // Find the closest city within its radius
  let closestCity: string | null = null;
  let closestDistance = Infinity;
  
  for (const city of cities) {
    const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
    if (distance <= city.radius && distance < closestDistance) {
      closestCity = city.name;
      closestDistance = distance;
    }
  }
  
  if (closestCity) return closestCity;
  
  // Fallback: Show actual geographic region
  if (lat > 66) return 'Arctic Region';
  if (lat < -66) return 'Antarctic Region';
  
  // Continental fallbacks
  if (lng >= -30 && lng <= 60 && lat >= 35 && lat <= 70) return 'Europe';
  if (lng >= -170 && lng <= -30 && lat >= 15 && lat <= 75) return 'North America';
  if (lng >= -85 && lng <= -30 && lat >= -60 && lat < 15) return 'South America';
  if (lng >= 60 && lng <= 150 && lat >= -10 && lat <= 55) return 'Asia';
  if (lng >= 100 && lng <= 180 && lat >= -50 && lat <= -10) return 'Oceania';
  if (lng >= -20 && lng <= 55 && lat >= -35 && lat < 35) return 'Africa';
  if (lng >= 40 && lng <= 80 && lat >= 5 && lat <= 40) return 'Middle East';
  
  return 'International Waters';
};

// City-level data marker (smaller for cleaner look, scales properly when zoomed)
const DataHotspot: React.FC<{
  marker: DataPointMarker;
  onSelect: (marker: DataPointMarker | null) => void;
  isSelected: boolean;
}> = ({ marker, onSelect, isSelected }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseSpeed = useRef(Math.random() * 0.8 + 0.3);
  
  // Fixed small size - doesn't scale with zoom
  const baseSize = Math.min(0.008 + (marker.count / 80) * 0.006, 0.025);
  
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed.current) * 0.08 + 0.96;
      meshRef.current.scale.setScalar(isSelected ? 1.3 : pulse);
      glowRef.current.scale.setScalar(isSelected ? 1.5 : pulse * 1.2);
    }
    
    // Billboard effect - always face camera to prevent distortion when zoomed
    if (groupRef.current) {
      groupRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  // Color based on intensity - green=high, cyan=medium, purple=new
  const color = marker.intensity > 0.7 ? '#22c55e' : marker.intensity > 0.4 ? '#06b6d4' : '#a855f7';

  return (
    <group 
      position={marker.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : marker);
      }}
    >
      {/* Billboard group - faces camera */}
      <group ref={groupRef}>
        {/* Core point - use circle instead of sphere for cleaner look when zoomed */}
        <mesh ref={meshRef}>
          <circleGeometry args={[baseSize, 16]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Inner glow */}
        <mesh ref={glowRef}>
          <circleGeometry args={[baseSize * 1.8, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Outer glow - very subtle */}
        <mesh>
          <circleGeometry args={[baseSize * 3, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      </group>
      
      {/* Popup when selected - shows city/region name, NOT coordinates */}
      {isSelected && (
        <Html center distanceFactor={4}>
          <div 
            className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 min-w-[120px] shadow-xl pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-900 font-bold text-xs">
              {marker.cityName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-cyan-600 text-sm font-bold">{marker.count}</span>
              <span className="text-gray-500 text-[10px]">data points</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Real data markers from database
const DataMarkers: React.FC<{
  cells: GlobalCoverageCell[];
  selectedMarker: DataPointMarker | null;
  onSelectMarker: (marker: DataPointMarker | null) => void;
}> = ({ cells, selectedMarker, onSelectMarker }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Convert real coverage data to markers with city names
  const markers = useMemo<DataPointMarker[]>(() => {
    if (!cells || cells.length === 0) return [];
    
    const maxCount = Math.max(...cells.map(c => c.count), 1);
    
    return cells.slice(0, 200).map(cell => ({
      lat: cell.lat,
      lng: cell.lng,
      count: cell.count,
      position: latLngToVector3(cell.lat, cell.lng, 1.54),
      intensity: cell.count / maxCount,
      cityName: getApproximateLocation(cell.lat, cell.lng),
    }));
  }, [cells]);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <group ref={groupRef}>
      {markers.map((marker, idx) => (
        <DataHotspot
          key={`${marker.lat}-${marker.lng}-${idx}`}
          marker={marker}
          onSelect={onSelectMarker}
          isSelected={selectedMarker?.lat === marker.lat && selectedMarker?.lng === marker.lng}
        />
      ))}
    </group>
  );
};

// Scene with enhanced lighting
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  selectedMarker: DataPointMarker | null;
  onSelectMarker: (marker: DataPointMarker | null) => void;
  isPersonalView?: boolean;
}> = ({ cells, selectedMarker, onSelectMarker, isPersonalView }) => {
  return (
    <>
      {/* Photorealistic lighting setup */}
      <ambientLight intensity={0.25} color="#b8d4ff" />
      
      {/* Sun - main light source */}
      <directionalLight 
        position={[5, 2, 5]} 
        intensity={1.8} 
        color="#fff5e6"
      />
      
      {/* Soft fill from opposite side */}
      <directionalLight 
        position={[-5, -2, -5]} 
        intensity={0.15} 
        color="#4da6ff" 
      />
      
      {/* Rim light for atmosphere edge */}
      <directionalLight 
        position={[0, 5, -3]} 
        intensity={0.3} 
        color="#87ceeb" 
      />
      
      {/* Deep space stars */}
      <Stars
        radius={300}
        depth={100}
        count={3000}
        factor={3}
        saturation={0.1}
        fade
        speed={0.05}
      />
      
      <Earth />
      <DataMarkers 
        cells={cells} 
        selectedMarker={selectedMarker}
        onSelectMarker={onSelectMarker}
      />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={isPersonalView ? 1.6 : 2.0}
        maxDistance={6}
        autoRotate={!selectedMarker && !isPersonalView}
        autoRotateSpeed={0.2}
        dampingFactor={0.05}
        enableDamping
        rotateSpeed={0.3}
        zoomSpeed={0.8}
      />
    </>
  );
};

// Loading fallback
const GlobeLoading: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm font-medium text-muted-foreground">Loading globe...</span>
    </div>
  </div>
);

// Error boundary for 3D canvas
const GlobeErrorFallback: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0f1a] to-[#020408]">
    <div className="text-center p-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-3xl">🌍</span>
      </div>
      <p className="text-white/70 text-sm">Globe temporarily unavailable</p>
      <p className="text-white/40 text-xs mt-1">Pull down to refresh</p>
    </div>
  </div>
);

// Main component
export const NetworkGlobe: React.FC<NetworkGlobeProps> = ({
  coverageData,
  loading = false,
  totalDataPoints = 0,
  uniqueLocations = 0,
  isPersonalView = false,
  userPosition = null,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<DataPointMarker | null>(null);
  const [hasError, setHasError] = useState(false);
  
  // Personal view starts very zoomed in (close to surface), global starts zoomed out
  // Camera z: lower = closer/more zoomed in, higher = farther/zoomed out
  const initialCameraZ = isPersonalView ? 1.7 : 3.2;
  
  // Calculate real stats from data
  const realStats = useMemo(() => {
    const uniqueCountries = new Set(coverageData.map(c => `${Math.floor(c.lat / 10)}-${Math.floor(c.lng / 10)}`)).size;
    return {
      dataPoints: totalDataPoints || coverageData.reduce((sum, c) => sum + c.count, 0),
      locations: uniqueLocations || coverageData.length,
      regions: uniqueCountries || Math.min(coverageData.length, 30),
    };
  }, [coverageData, totalDataPoints, uniqueLocations]);

  if (hasError) {
    return <GlobeErrorFallback />;
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0a0f1a] via-[#050a12] to-[#020408] overflow-hidden">
      {/* Top stats bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
            </div>
            <span className="text-green-500 text-sm font-bold tracking-wide">LIVE</span>
          </div>
          <span className="text-white/40 text-xs">Community Coverage Map</span>
        </div>
        
        {/* Legend - moved here */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-white/60 text-[10px] font-medium">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-white/60 text-[10px] font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-white/60 text-[10px] font-medium">New</span>
          </div>
        </div>
        
        {/* Stats row - shows REAL data from database */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.dataPoints.toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Samples</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.locations.toLocaleString()}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Cities</div>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-white text-base font-bold tabular-nums">
              {realStats.regions}
            </div>
            <div className="text-white/50 text-[10px] font-medium">Regions</div>
          </div>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[65vh] max-h-[550px]">
          <Suspense fallback={<GlobeLoading />}>
            <Canvas
              camera={{ position: [0, 0.2, initialCameraZ], fov: 45 }}
              gl={{ 
                antialias: true, 
                alpha: true, 
                powerPreference: 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2,
              }}
              dpr={[1, 2]}
              onPointerMissed={() => setSelectedMarker(null)}
              onError={() => setHasError(true)}
            >
              <GlobeScene 
                cells={coverageData}
                selectedMarker={selectedMarker}
                onSelectMarker={setSelectedMarker}
                isPersonalView={isPersonalView}
              />
            </Canvas>
          </Suspense>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020408]/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary text-sm font-medium">Loading network data...</span>
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020408] to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default NetworkGlobe;