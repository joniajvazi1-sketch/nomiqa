import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Radio } from 'lucide-react';

interface MiniContributionMapProps {
  className?: string;
  contributionPoints?: number;
  dataPointsCount?: number;
}

/**
 * Mini contribution map preview for the home dashboard
 * Shows a visual map-like preview with coverage areas
 */
export const MiniContributionMap: React.FC<MiniContributionMapProps> = ({ 
  className,
  contributionPoints = 0,
  dataPointsCount = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with dark map background
    ctx.fillStyle = 'hsl(220, 20%, 8%)';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle "roads" to simulate a map
    ctx.strokeStyle = 'hsla(220, 10%, 20%, 0.8)';
    ctx.lineWidth = 2;
    
    // Horizontal roads
    const roads = [
      { y: height * 0.25, width: 3 },
      { y: height * 0.5, width: 4 },
      { y: height * 0.75, width: 2 },
    ];
    roads.forEach(road => {
      ctx.lineWidth = road.width;
      ctx.beginPath();
      ctx.moveTo(0, road.y);
      ctx.lineTo(width, road.y);
      ctx.stroke();
    });
    
    // Vertical roads
    const vRoads = [
      { x: width * 0.2, width: 2 },
      { x: width * 0.5, width: 3 },
      { x: width * 0.8, width: 2 },
    ];
    vRoads.forEach(road => {
      ctx.lineWidth = road.width;
      ctx.beginPath();
      ctx.moveTo(road.x, 0);
      ctx.lineTo(road.x, height);
      ctx.stroke();
    });

    // Generate coverage zones based on points
    const numZones = Math.min(Math.max(2, Math.floor(contributionPoints / 200)), 8);
    const zones: { x: number; y: number; size: number }[] = [];
    
    // Seed random based on points for consistency
    const seed = contributionPoints % 1000;
    const seededRandom = (i: number) => {
      const x = Math.sin(seed + i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let i = 0; i < numZones; i++) {
      zones.push({
        x: seededRandom(i * 3) * width * 0.7 + width * 0.15,
        y: seededRandom(i * 3 + 1) * height * 0.7 + height * 0.15,
        size: seededRandom(i * 3 + 2) * 30 + 25,
      });
    }

    // Draw coverage zones with gradient
    zones.forEach((zone) => {
      const gradient = ctx.createRadialGradient(
        zone.x, zone.y, 0,
        zone.x, zone.y, zone.size
      );
      gradient.addColorStop(0, 'hsla(180, 100%, 60%, 0.5)');
      gradient.addColorStop(0.4, 'hsla(180, 100%, 55%, 0.3)');
      gradient.addColorStop(0.7, 'hsla(200, 100%, 50%, 0.15)');
      gradient.addColorStop(1, 'hsla(220, 100%, 50%, 0)');

      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Draw small data points
    const numPoints = Math.min(Math.max(5, Math.floor(dataPointsCount / 50)), 20);
    for (let i = 0; i < numPoints; i++) {
      const x = seededRandom(i * 5 + 100) * width * 0.85 + width * 0.075;
      const y = seededRandom(i * 5 + 101) * height * 0.85 + height * 0.075;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(180, 100%, 70%, 0.8)';
      ctx.fill();
    }

    // Animated pulse effect
    let animationFrame: number;
    let time = 0;

    const animate = () => {
      // Only animate the pulse rings, not redraw everything
      ctx.fillStyle = 'hsl(220, 20%, 8%)';
      ctx.fillRect(0, 0, width, height);

      // Redraw roads
      ctx.strokeStyle = 'hsla(220, 10%, 20%, 0.8)';
      roads.forEach(road => {
        ctx.lineWidth = road.width;
        ctx.beginPath();
        ctx.moveTo(0, road.y);
        ctx.lineTo(width, road.y);
        ctx.stroke();
      });
      vRoads.forEach(road => {
        ctx.lineWidth = road.width;
        ctx.beginPath();
        ctx.moveTo(road.x, 0);
        ctx.lineTo(road.x, height);
        ctx.stroke();
      });

      // Draw coverage zones with animated pulse
      zones.forEach((zone, i) => {
        const pulseScale = 1 + Math.sin(time * 0.03 + i) * 0.1;
        const gradient = ctx.createRadialGradient(
          zone.x, zone.y, 0,
          zone.x, zone.y, zone.size * pulseScale
        );
        gradient.addColorStop(0, 'hsla(180, 100%, 60%, 0.5)');
        gradient.addColorStop(0.4, 'hsla(180, 100%, 55%, 0.3)');
        gradient.addColorStop(0.7, 'hsla(200, 100%, 50%, 0.15)');
        gradient.addColorStop(1, 'hsla(220, 100%, 50%, 0)');

        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.size * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Redraw data points
      for (let i = 0; i < numPoints; i++) {
        const x = seededRandom(i * 5 + 100) * width * 0.85 + width * 0.075;
        const y = seededRandom(i * 5 + 101) * height * 0.85 + height * 0.075;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(180, 100%, 70%, 0.8)';
        ctx.fill();
      }

      // Center pulse ring
      const centerX = width / 2;
      const centerY = height / 2;
      const pulseRadius = 15 + (time % 60);
      const pulseAlpha = Math.max(0, 0.4 - (time % 60) / 60 * 0.4);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(180, 100%, 70%, ${pulseAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      time++;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [contributionPoints, dataPointsCount]);

  return (
    <div 
      className={cn(
        'relative overflow-hidden transition-all duration-700',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={140}
        className="w-full h-full"
      />
      
      {/* Center location marker */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center animate-pulse">
            <Radio className="w-4 h-4 text-neon-cyan" />
          </div>
        </div>
      </div>
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30 pointer-events-none" />
    </div>
  );
};

export default MiniContributionMap;