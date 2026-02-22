import React, { useRef, useMemo, Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, Html } from '@react-three/drei';
import { useTheme } from 'next-themes';
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
const Earth: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => {
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
          specular={new THREE.Color(isDark ? 0x333333 : 0x666666)}
          shininess={isDark ? 25 : 40}
        />
      </mesh>
      
      {/* Night side with city lights - only in dark mode */}
      {isDark && (
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
      )}
      
      {/* Cloud layer - more visible in light mode */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.52, 64, 64]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={isDark ? 0.08 : 0.18}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner atmosphere - Rayleigh scattering */}
      <Sphere args={[1.55, 64, 64]}>
        <meshBasicMaterial
          color={isDark ? "#6ab7ff" : "#87ceeb"}
          transparent
          opacity={isDark ? 0.06 : 0.12}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Outer atmosphere glow */}
      <Sphere args={[1.65, 64, 64]}>
        <meshBasicMaterial
          color={isDark ? "#4d9fff" : "#a0d8ef"}
          transparent
          opacity={isDark ? 0.04 : 0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Faint haze */}
      <Sphere args={[1.75, 64, 64]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={isDark ? 0.02 : 0.06}
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
    
    // Russia
    { name: 'Moscow', lat: 55.8, lng: 37.6, radius: 2 },
    { name: 'St. Petersburg', lat: 59.9, lng: 30.3, radius: 1.5 },
    { name: 'Novosibirsk', lat: 55, lng: 82.9, radius: 1.2 },
    { name: 'Kazan', lat: 55.8, lng: 49.1, radius: 1.2 },
    { name: 'Vladivostok', lat: 43.1, lng: 131.9, radius: 1.2 },
    { name: 'Yekaterinburg', lat: 56.8, lng: 60.6, radius: 1.2 },
    { name: 'Sochi', lat: 43.6, lng: 39.7, radius: 1 },
    { name: 'Kaliningrad', lat: 54.7, lng: 20.5, radius: 1 },
    
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
    { name: 'Poznan', lat: 52.4, lng: 16.9, radius: 1 },
    { name: 'Lodz', lat: 51.8, lng: 19.5, radius: 1 },
    { name: 'Szczecin', lat: 53.4, lng: 14.5, radius: 1 },
    { name: 'Lublin', lat: 51.2, lng: 22.6, radius: 1 },
    { name: 'Katowice', lat: 50.3, lng: 19, radius: 1 },
    
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
    { name: 'Calgary', lat: 51.1, lng: -114.1, radius: 1.2 },
    { name: 'Edmonton', lat: 53.5, lng: -113.5, radius: 1.2 },
    { name: 'Ottawa', lat: 45.4, lng: -75.7, radius: 1 },
    { name: 'Quebec City', lat: 46.8, lng: -71.2, radius: 1 },
    { name: 'Winnipeg', lat: 49.9, lng: -97.1, radius: 1 },
    { name: 'Halifax', lat: 44.6, lng: -63.6, radius: 1 },
    { name: 'Las Vegas', lat: 36.2, lng: -115.1, radius: 1.2 },
    { name: 'Orlando', lat: 28.5, lng: -81.4, radius: 1.2 },
    { name: 'Nashville', lat: 36.2, lng: -86.8, radius: 1 },
    { name: 'Austin', lat: 30.3, lng: -97.7, radius: 1 },
    { name: 'Portland', lat: 45.5, lng: -122.7, radius: 1 },
    { name: 'Minneapolis', lat: 44.98, lng: -93.3, radius: 1 },
    { name: 'Detroit', lat: 42.3, lng: -83, radius: 1.2 },
    { name: 'Mexico City', lat: 19.4, lng: -99.1, radius: 2 },
    { name: 'Guadalajara', lat: 20.7, lng: -103.3, radius: 1 },
    { name: 'Cancun', lat: 21.2, lng: -86.8, radius: 1 },
    { name: 'Monterrey', lat: 25.7, lng: -100.3, radius: 1.2 },
    
    // Caribbean
    { name: 'Havana', lat: 23.1, lng: -82.4, radius: 1.5 },
    { name: 'Kingston', lat: 18, lng: -76.8, radius: 1.2 },
    { name: 'Santo Domingo', lat: 18.5, lng: -69.9, radius: 1.2 },
    { name: 'San Juan', lat: 18.5, lng: -66.1, radius: 1.2 },
    { name: 'Nassau', lat: 25.1, lng: -77.4, radius: 1 },
    { name: 'Barbados', lat: 13.1, lng: -59.6, radius: 1 },
    { name: 'Trinidad', lat: 10.5, lng: -61.3, radius: 1 },
    { name: 'Aruba', lat: 12.5, lng: -70, radius: 0.8 },
    
    // Asia - Major cities
    { name: 'Tokyo', lat: 35.7, lng: 139.7, radius: 2 },
    { name: 'Singapore', lat: 1.3, lng: 103.8, radius: 1 },
    { name: 'Hong Kong', lat: 22.3, lng: 114.2, radius: 1 },
    { name: 'Seoul', lat: 37.6, lng: 127, radius: 1.5 },
    { name: 'Busan', lat: 35.2, lng: 129, radius: 1.2 },
    { name: 'Incheon', lat: 37.5, lng: 126.7, radius: 1 },
    { name: 'Daegu', lat: 35.9, lng: 128.6, radius: 1 },
    { name: 'Jeju', lat: 33.5, lng: 126.5, radius: 1 },
    { name: 'Gwangju', lat: 35.2, lng: 126.9, radius: 1 },
    { name: 'Mumbai', lat: 19.1, lng: 72.9, radius: 1.5 },
    { name: 'Dubai', lat: 25.2, lng: 55.3, radius: 1.5 },
    { name: 'Shanghai', lat: 31.2, lng: 121.5, radius: 2 },
    { name: 'Beijing', lat: 39.9, lng: 116.4, radius: 2 },
    { name: 'Bangkok', lat: 13.8, lng: 100.5, radius: 1.5 },
    { name: 'Kuala Lumpur', lat: 3.1, lng: 101.7, radius: 1 },
    { name: 'Jakarta', lat: -6.2, lng: 106.8, radius: 2 },
    { name: 'Manila', lat: 14.6, lng: 121, radius: 1.5 },
    { name: 'Davao', lat: 7.1, lng: 125.6, radius: 1.2 },
    { name: 'Clark', lat: 15.2, lng: 120.6, radius: 1 },
    { name: 'Boracay', lat: 11.97, lng: 121.93, radius: 0.8 },
    { name: 'Palawan', lat: 9.8, lng: 118.7, radius: 1 },
    { name: 'Iloilo', lat: 10.7, lng: 122.6, radius: 1 },
    { name: 'Delhi', lat: 28.6, lng: 77.2, radius: 2 },
    { name: 'Bangalore', lat: 13, lng: 77.6, radius: 1.5 },
    { name: 'Chennai', lat: 13.1, lng: 80.3, radius: 1.2 },
    { name: 'Hyderabad', lat: 17.4, lng: 78.5, radius: 1.2 },
    { name: 'Osaka', lat: 34.7, lng: 135.5, radius: 1.5 },
    { name: 'Kyoto', lat: 35, lng: 135.8, radius: 1 },
    { name: 'Nagoya', lat: 35.2, lng: 136.9, radius: 1.2 },
    { name: 'Fukuoka', lat: 33.6, lng: 130.4, radius: 1.2 },
    { name: 'Sapporo', lat: 43.1, lng: 141.4, radius: 1.2 },
    { name: 'Yokohama', lat: 35.4, lng: 139.6, radius: 1.2 },
    { name: 'Taipei', lat: 25, lng: 121.5, radius: 1 },
    { name: 'Kaohsiung', lat: 22.6, lng: 120.3, radius: 1.2 },
    { name: 'Taichung', lat: 24.1, lng: 120.7, radius: 1 },
    { name: 'Tainan', lat: 23, lng: 120.2, radius: 1 },
    { name: 'Hsinchu', lat: 24.8, lng: 121, radius: 0.8 },
    { name: 'Ho Chi Minh City', lat: 10.8, lng: 106.6, radius: 1.5 },
    { name: 'Hanoi', lat: 21, lng: 105.8, radius: 1 },
    { name: 'Hue', lat: 16.5, lng: 107.6, radius: 1 },
    { name: 'Nha Trang', lat: 12.2, lng: 109.2, radius: 1 },
    { name: 'Can Tho', lat: 10.1, lng: 105.8, radius: 1 },
    { name: 'Hai Phong', lat: 20.9, lng: 106.7, radius: 1 },
    { name: 'Phu Quoc', lat: 10.2, lng: 104, radius: 0.8 },
    { name: 'Shenzhen', lat: 22.5, lng: 114.1, radius: 1.5 },
    { name: 'Guangzhou', lat: 23.1, lng: 113.3, radius: 1.5 },
    { name: 'Chengdu', lat: 30.7, lng: 104.1, radius: 1.5 },
    { name: 'Xi\'an', lat: 34.3, lng: 108.9, radius: 1.2 },
    { name: 'Hangzhou', lat: 30.3, lng: 120.2, radius: 1.2 },
    { name: 'Nanjing', lat: 32.1, lng: 118.8, radius: 1.2 },
    { name: 'Wuhan', lat: 30.6, lng: 114.3, radius: 1.5 },
    { name: 'Chongqing', lat: 29.6, lng: 106.5, radius: 1.5 },
    { name: 'Kolkata', lat: 22.6, lng: 88.4, radius: 1.5 },
    { name: 'Colombo', lat: 6.9, lng: 79.9, radius: 1.2 },
    { name: 'Dhaka', lat: 23.8, lng: 90.4, radius: 1.5 },
    { name: 'Kathmandu', lat: 27.7, lng: 85.3, radius: 1 },
    { name: 'Lahore', lat: 31.5, lng: 74.3, radius: 1.5 },
    { name: 'Karachi', lat: 24.9, lng: 67, radius: 1.5 },
    { name: 'Islamabad', lat: 33.7, lng: 73.1, radius: 1 },
    { name: 'Pune', lat: 18.5, lng: 73.9, radius: 1.2 },
    { name: 'Ahmedabad', lat: 23, lng: 72.6, radius: 1.2 },
    { name: 'Abu Dhabi', lat: 24.5, lng: 54.4, radius: 1 },
    { name: 'Doha', lat: 25.3, lng: 51.5, radius: 1 },
    { name: 'Riyadh', lat: 24.7, lng: 46.7, radius: 1.5 },
    { name: 'Tel Aviv', lat: 32.1, lng: 34.8, radius: 1 },
    { name: 'Istanbul', lat: 41, lng: 29, radius: 2 },
    { name: 'Ankara', lat: 39.9, lng: 32.9, radius: 1.5 },
    { name: 'Izmir', lat: 38.4, lng: 27.1, radius: 1.2 },
    { name: 'Bursa', lat: 40.2, lng: 29, radius: 1 },
    { name: 'Adana', lat: 37, lng: 35.3, radius: 1 },
    { name: 'Antalya', lat: 36.9, lng: 30.7, radius: 1.2 },
    { name: 'Jeddah', lat: 21.5, lng: 39.2, radius: 1.5 },
    { name: 'Kuwait City', lat: 29.4, lng: 47.9, radius: 1.2 },
    { name: 'Muscat', lat: 23.6, lng: 58.5, radius: 1 },
    { name: 'Amman', lat: 31.9, lng: 35.9, radius: 1.2 },
    { name: 'Beirut', lat: 33.9, lng: 35.5, radius: 1 },
    { name: 'Bahrain', lat: 26.2, lng: 50.6, radius: 1 },
    { name: 'Tehran', lat: 35.7, lng: 51.4, radius: 1.5 },
    { name: 'Isfahan', lat: 32.7, lng: 51.7, radius: 1.2 },
    { name: 'Shiraz', lat: 29.6, lng: 52.5, radius: 1 },
    { name: 'Mashhad', lat: 36.3, lng: 59.6, radius: 1.2 },
    { name: 'Tabriz', lat: 38.1, lng: 46.3, radius: 1 },
    
    // Central Asia & Caucasus
    { name: 'Almaty', lat: 43.2, lng: 76.9, radius: 1.5 },
    { name: 'Tashkent', lat: 41.3, lng: 69.3, radius: 1.5 },
    { name: 'Tbilisi', lat: 41.7, lng: 44.8, radius: 1.2 },
    { name: 'Baku', lat: 40.4, lng: 49.9, radius: 1.2 },
    { name: 'Astana', lat: 51.2, lng: 71.4, radius: 1.2 },
    { name: 'Bishkek', lat: 42.9, lng: 74.6, radius: 1 },
    { name: 'Yerevan', lat: 40.2, lng: 44.5, radius: 1 },
    
    // Southeast Asia & Pacific Islands
    { name: 'Phuket', lat: 7.9, lng: 98.4, radius: 1 },
    { name: 'Bali', lat: -8.4, lng: 115.2, radius: 1.2 },
    { name: 'Cebu', lat: 10.3, lng: 123.9, radius: 1 },
    { name: 'Chiang Mai', lat: 18.8, lng: 99, radius: 1 },
    { name: 'Pattaya', lat: 12.9, lng: 100.9, radius: 0.8 },
    { name: 'Penang', lat: 5.4, lng: 100.3, radius: 1 },
    { name: 'Da Nang', lat: 16.1, lng: 108.2, radius: 1 },
    { name: 'Siem Reap', lat: 13.4, lng: 103.9, radius: 1 },
    { name: 'Phnom Penh', lat: 11.6, lng: 104.9, radius: 1.2 },
    { name: 'Yangon', lat: 16.8, lng: 96.2, radius: 1.5 },
    { name: 'Surabaya', lat: -7.3, lng: 112.7, radius: 1.2 },
    { name: 'Bandung', lat: -6.9, lng: 107.6, radius: 1 },
    { name: 'Yogyakarta', lat: -7.8, lng: 110.4, radius: 1 },
    { name: 'Fiji', lat: -18, lng: 179, radius: 2 },
    { name: 'Honolulu', lat: 21.3, lng: -157.9, radius: 1.5 },
    { name: 'Guam', lat: 13.4, lng: 144.8, radius: 1 },
    
    // Africa
    { name: 'Cape Town', lat: -33.9, lng: 18.4, radius: 1.5 },
    { name: 'Cairo', lat: 30, lng: 31.2, radius: 2 },
    { name: 'Alexandria', lat: 31.2, lng: 29.9, radius: 1.2 },
    { name: 'Luxor', lat: 25.7, lng: 32.6, radius: 1 },
    { name: 'Aswan', lat: 24.1, lng: 32.9, radius: 0.8 },
    { name: 'Sharm El Sheikh', lat: 27.9, lng: 34.3, radius: 1 },
    { name: 'Hurghada', lat: 27.3, lng: 33.8, radius: 1 },
    { name: 'Johannesburg', lat: -26.2, lng: 28, radius: 1.5 },
    { name: 'Lagos', lat: 6.5, lng: 3.4, radius: 2 },
    { name: 'Abuja', lat: 9.1, lng: 7.5, radius: 1.2 },
    { name: 'Port Harcourt', lat: 4.8, lng: 7, radius: 1 },
    { name: 'Ibadan', lat: 7.4, lng: 3.9, radius: 1 },
    { name: 'Kano', lat: 12, lng: 8.5, radius: 1.2 },
    { name: 'Enugu', lat: 6.5, lng: 7.5, radius: 1 },
    { name: 'Nairobi', lat: -1.3, lng: 36.8, radius: 1.5 },
    { name: 'Casablanca', lat: 33.6, lng: -7.6, radius: 1.5 },
    { name: 'Accra', lat: 5.6, lng: -0.2, radius: 1 },
    { name: 'Addis Ababa', lat: 9, lng: 38.7, radius: 1.5 },
    { name: 'Dar es Salaam', lat: -6.8, lng: 39.3, radius: 1 },
    { name: 'Durban', lat: -29.9, lng: 31, radius: 1 },
    { name: 'Algiers', lat: 36.8, lng: 3, radius: 1 },
    { name: 'Tunis', lat: 36.8, lng: 10.2, radius: 1 },
    { name: 'Marrakech', lat: 31.6, lng: -8, radius: 1 },
    { name: 'Rabat', lat: 34, lng: -6.8, radius: 1.2 },
    { name: 'Fez', lat: 34, lng: -5, radius: 1 },
    { name: 'Tangier', lat: 35.8, lng: -5.8, radius: 1 },
    { name: 'Agadir', lat: 30.4, lng: -9.6, radius: 1 },
    { name: 'Essaouira', lat: 31.5, lng: -9.8, radius: 0.8 },
    { name: 'Kigali', lat: -1.9, lng: 30.1, radius: 1 },
    { name: 'Luanda', lat: -8.8, lng: 13.2, radius: 1.5 },
    { name: 'Dakar', lat: 14.7, lng: -17.5, radius: 1.2 },
    { name: 'Abidjan', lat: 5.3, lng: -4, radius: 1.5 },
    { name: 'Kampala', lat: 0.3, lng: 32.6, radius: 1 },
    { name: 'Kinshasa', lat: -4.3, lng: 15.3, radius: 1.5 },
    
    // Australia & Oceania
    { name: 'Sydney', lat: -33.9, lng: 151.2, radius: 2 },
    { name: 'Melbourne', lat: -37.8, lng: 145, radius: 2 },
    { name: 'Brisbane', lat: -27.5, lng: 153, radius: 1.5 },
    { name: 'Perth', lat: -31.9, lng: 115.9, radius: 1.5 },
    { name: 'Adelaide', lat: -34.9, lng: 138.6, radius: 1.2 },
    { name: 'Gold Coast', lat: -28, lng: 153.4, radius: 1 },
    { name: 'Canberra', lat: -35.3, lng: 149.1, radius: 1 },
    { name: 'Darwin', lat: -12.5, lng: 130.8, radius: 1 },
    { name: 'Hobart', lat: -42.9, lng: 147.3, radius: 1 },
    { name: 'Auckland', lat: -36.8, lng: 174.8, radius: 1.5 },
    { name: 'Wellington', lat: -41.3, lng: 174.8, radius: 1 },
    { name: 'Christchurch', lat: -43.5, lng: 172.6, radius: 1 },
    
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
    { name: 'Brasília', lat: -15.8, lng: -47.9, radius: 1.5 },
    { name: 'Curitiba', lat: -25.4, lng: -49.3, radius: 1.2 },
    { name: 'Cartagena', lat: 10.4, lng: -75.5, radius: 1 },
    { name: 'Cusco', lat: -13.5, lng: -72, radius: 1 },
    { name: 'Belo Horizonte', lat: -19.9, lng: -43.9, radius: 1.2 },
    { name: 'Porto Alegre', lat: -30.1, lng: -51.2, radius: 1 },
    { name: 'Córdoba', lat: -31.4, lng: -64.2, radius: 1 },
    { name: 'Fortaleza', lat: -3.7, lng: -38.5, radius: 1.2 },
    { name: 'Recife', lat: -8, lng: -34.9, radius: 1.2 },
    { name: 'Salvador', lat: -13, lng: -38.5, radius: 1.2 },
    { name: 'Manaus', lat: -3.1, lng: -60, radius: 1.5 },
    { name: 'Florianópolis', lat: -27.6, lng: -48.5, radius: 1 },
    { name: 'Natal', lat: -5.8, lng: -35.2, radius: 1 },
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
  const pinRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const pulseSpeed = useRef(Math.random() * 2 + 1.5);
  const flashOffset = useRef(Math.random() * Math.PI * 2);
  const [rippleActive, setRippleActive] = useState(false);
  const rippleStartTime = useRef(0);
  
  // Pin size based on data count
  const pinHeadSize = Math.min(0.012 + (marker.count / 100) * 0.008, 0.028);
  const pinHeight = pinHeadSize * 2.5;
  
  // Color based on intensity - green=high, cyan=medium, purple=new
  const baseColor = marker.intensity > 0.7 ? new THREE.Color('#22c55e') : marker.intensity > 0.4 ? new THREE.Color('#06b6d4') : new THREE.Color('#a855f7');
  const brightColor = marker.intensity > 0.7 ? new THREE.Color('#4ade80') : marker.intensity > 0.4 ? new THREE.Color('#22d3ee') : new THREE.Color('#c084fc');
  const darkColor = marker.intensity > 0.7 ? '#16a34a' : marker.intensity > 0.4 ? '#0891b2' : '#9333ea';
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Flash effect on head only - oscillates between base and bright color
    const flash = (Math.sin(time * pulseSpeed.current + flashOffset.current) + 1) / 2;
    
    if (headRef.current && headRef.current.material) {
      const mat = headRef.current.material as THREE.MeshBasicMaterial;
      mat.color.lerpColors(baseColor, brightColor, flash * 0.7);
    }
    
    // Glow pulse
    if (glowRef.current && glowRef.current.material) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.1 + flash * 0.2;
    }
    
    // Ripple animation
    if (rippleActive && rippleRef.current) {
      const elapsed = time - rippleStartTime.current;
      const duration = 0.6;
      const progress = Math.min(elapsed / duration, 1);
      
      // Expand and fade out
      const scale = 1 + progress * 4;
      const opacity = 0.5 * (1 - progress);
      
      rippleRef.current.scale.setScalar(scale);
      (rippleRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
      
      if (progress >= 1) {
        setRippleActive(false);
      }
    }
    
    // Scale up when selected (no bounce/movement)
    if (pinRef.current) {
      pinRef.current.scale.setScalar(isSelected ? 1.2 : 1);
    }
    
    // Billboard effect - pin always faces camera
    if (groupRef.current) {
      groupRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setRippleActive(true);
    rippleStartTime.current = e.eventObject.parent?.parent?.parent ? 
      (performance.now() / 1000) : 0;
    onSelect(isSelected ? null : marker);
  };

  return (
    <group 
      position={marker.position}
      onClick={handleClick}
    >
      {/* Billboard group - faces camera */}
      <group ref={groupRef}>
        <group ref={pinRef}>
          {/* Pin needle/stem - thin cylinder pointing down */}
          <mesh position={[0, -pinHeight * 0.4, 0]}>
            <cylinderGeometry args={[pinHeadSize * 0.15, pinHeadSize * 0.08, pinHeight * 0.8, 8]} />
            <meshBasicMaterial color={darkColor} />
          </mesh>
          
          {/* Pin head - larger sphere at top with flash effect */}
          <mesh ref={headRef} position={[0, pinHeight * 0.1, 0]}>
            <sphereGeometry args={[pinHeadSize, 16, 12]} />
            <meshBasicMaterial color={baseColor} />
          </mesh>
          
          {/* Pin head highlight - inner shine */}
          <mesh position={[0, pinHeight * 0.1 + pinHeadSize * 0.3, pinHeadSize * 0.2]}>
            <sphereGeometry args={[pinHeadSize * 0.3, 8, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          
          {/* Pulsing glow ring around pin */}
          <mesh ref={glowRef} position={[0, pinHeight * 0.1, 0]}>
            <sphereGeometry args={[pinHeadSize * 1.6, 16, 12]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.2} />
          </mesh>
          
          {/* Drop shadow - offset below pin for depth */}
          <mesh position={[0.006, -pinHeight * 1.1, -0.003]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}>
            <circleGeometry args={[pinHeadSize * 0.8, 16]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Glow at base */}
          <mesh position={[0, -pinHeight * 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[pinHeadSize * 1.2, 16]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Click ripple effect */}
          {rippleActive && (
            <mesh ref={rippleRef} position={[0, pinHeight * 0.1, 0]}>
              <ringGeometry args={[pinHeadSize * 0.8, pinHeadSize * 1.2, 32]} />
              <meshBasicMaterial color={brightColor} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      </group>
      
      {/* Popup when selected - shows city/region name */}
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
  
  // Convert real coverage data to markers with city names, filtering out overlapping pins
  const markers = useMemo<DataPointMarker[]>(() => {
    if (!cells || cells.length === 0) return [];
    
    const maxCount = Math.max(...cells.map(c => c.count), 1);
    const minDistance = 0.08; // Minimum distance between pins to prevent overlap
    
    const filteredCells: typeof cells = [];
    
    // Filter out cells that are too close to each other
    for (const cell of cells.slice(0, 500)) {
      const isTooClose = filteredCells.some(existing => {
        const latDiff = Math.abs(existing.lat - cell.lat);
        const lngDiff = Math.abs(existing.lng - cell.lng);
        return latDiff < 1.0 && lngDiff < 1.0; // ~1.0 degrees apart minimum (shows more pins)
      });
      
      if (!isTooClose) {
        filteredCells.push(cell);
      }
    }
    
    return filteredCells.slice(0, 200).map(cell => ({
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

// Scene with enhanced lighting - theme-aware
const GlobeScene: React.FC<{
  cells: GlobalCoverageCell[];
  selectedMarker: DataPointMarker | null;
  onSelectMarker: (marker: DataPointMarker | null) => void;
  isPersonalView?: boolean;
  isDark?: boolean;
}> = ({ cells, selectedMarker, onSelectMarker, isPersonalView, isDark = true }) => {
  return (
    <>
      {/* Ambient: brighter in light mode for daytime feel */}
      <ambientLight intensity={isDark ? 0.4 : 0.8} color={isDark ? "#b8d4ff" : "#ffffff"} />
      
      {/* Sun - main light source, stronger in light mode */}
      <directionalLight 
        position={[5, 2, 5]} 
        intensity={isDark ? 1.8 : 2.8} 
        color={isDark ? "#fff5e6" : "#fffdf5"}
      />
      
      {/* Soft fill from opposite side */}
      <directionalLight 
        position={[-5, -2, -5]} 
        intensity={isDark ? 0.15 : 0.5} 
        color={isDark ? "#4da6ff" : "#87ceeb"} 
      />
      
      {/* Rim light for atmosphere edge */}
      <directionalLight 
        position={[0, 5, -3]} 
        intensity={isDark ? 0.3 : 0.6} 
        color="#87ceeb" 
      />
      
      {/* Stars only in dark mode */}
      {isDark && (
        <Stars radius={100} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />
      )}
      
      <Earth isDark={isDark} />
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
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-muted to-background">
    <div className="text-center p-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-3xl">🌍</span>
      </div>
      <p className="text-muted-foreground text-sm">Globe temporarily unavailable</p>
      <p className="text-muted-foreground/60 text-xs mt-1">Pull down to refresh</p>
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
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  
  // IntersectionObserver: pause Three.js rendering when globe is scrolled off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  
  // Personal view starts zoomed in (close to surface), global starts max zoomed OUT
  // Camera z: lower = closer/more zoomed in, higher = farther/zoomed out
  const initialCameraZ = isPersonalView ? 2.5 : 50;
  
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
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-transparent">
      {/* Top stats bar - aligned with parent badges */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-background/80 via-background/40 to-transparent dark:from-transparent dark:via-transparent dark:to-transparent" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-center mb-2">
          <span className="text-muted-foreground text-xs font-medium">Community Coverage Map</span>
        </div>
        
        {/* Legend - moved here */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground text-[10px] font-medium">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-muted-foreground text-[10px] font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-muted-foreground text-[10px] font-medium">New</span>
          </div>
        </div>
        
        {/* Stats row - shows REAL data from database */}
        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-black/10 dark:bg-white/5 backdrop-blur-md border border-black/15 dark:border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.dataPoints.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-[10px] font-medium">Samples</div>
          </div>
          <div className="flex-1 bg-black/10 dark:bg-white/5 backdrop-blur-md border border-black/15 dark:border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.locations.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-[10px] font-medium">Cities</div>
          </div>
          <div className="flex-1 bg-black/10 dark:bg-white/5 backdrop-blur-md border border-black/15 dark:border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-foreground text-base font-bold tabular-nums">
              {realStats.regions}
            </div>
            <div className="text-muted-foreground text-[10px] font-medium">Regions</div>
          </div>
        </div>
      </div>

      {/* 3D Globe Canvas - centered between stats header and bottom */}
      <div className="absolute left-0 right-0 bottom-0 top-[90px] flex items-center justify-center pointer-events-none" style={{ touchAction: 'none' }}>
        <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px]" style={{ pointerEvents: 'none', touchAction: 'none' }}>
          <Suspense fallback={<GlobeLoading />}>
            <Canvas
              camera={{ position: [0, 0.3, initialCameraZ], fov: 45 }}
              frameloop={isVisible ? 'always' : 'never'}
              gl={{ 
                antialias: false, 
                alpha: true, 
                powerPreference: 'low-power',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2,
              }}
              dpr={[1, 1.5]}
              onPointerMissed={() => setSelectedMarker(null)}
              onError={() => setHasError(true)}
              style={{ touchAction: 'pan-y', pointerEvents: 'auto' }}
            >
              <GlobeScene 
                cells={coverageData}
                selectedMarker={selectedMarker}
                onSelectMarker={setSelectedMarker}
                isPersonalView={isPersonalView}
                isDark={isDark}
              />
            </Canvas>
          </Suspense>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary text-sm font-medium">Loading network data...</span>
          </div>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default NetworkGlobe;