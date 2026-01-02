import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MiniContributionMapProps {
  className?: string;
  contributionPoints?: number;
}

/**
 * Mini contribution map preview for the home dashboard
 * Shows a small animated preview of network contribution areas
 */
export const MiniContributionMap: React.FC<MiniContributionMapProps> = ({ 
  className,
  contributionPoints = 0 
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
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'hsla(180, 100%, 70%, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Generate random contribution points based on actual points
    const numPoints = Math.min(Math.max(3, Math.floor(contributionPoints / 100)), 15);
    const points: { x: number; y: number; size: number; pulse: number }[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * width * 0.8 + width * 0.1,
        y: Math.random() * height * 0.8 + height * 0.1,
        size: Math.random() * 8 + 4,
        pulse: Math.random() * Math.PI * 2
      });
    }

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'hsla(180, 100%, 70%, 0.06)';
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw contribution points with pulse animation
      points.forEach((point, i) => {
        const pulseScale = 1 + Math.sin(time * 0.02 + point.pulse) * 0.3;
        const alpha = 0.4 + Math.sin(time * 0.03 + point.pulse) * 0.2;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, point.size * pulseScale * 2
        );
        gradient.addColorStop(0, `hsla(180, 100%, 70%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(180, 100%, 70%, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'hsla(180, 100%, 70%, 0)');

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * pulseScale * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core point
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(180, 100%, 70%)';
        ctx.fill();
      });

      // Draw connection lines between nearby points
      ctx.strokeStyle = 'hsla(180, 100%, 70%, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      time++;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [contributionPoints]);

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-xl transition-all duration-700',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
    >
      <canvas
        ref={canvasRef}
        width={140}
        height={80}
        className="w-full h-full"
      />
      {/* Scanning overlay effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, hsla(180, 100%, 70%, 0.1) 50%, transparent 100%)',
          backgroundSize: '100% 200%',
          animation: 'scanline 2s linear infinite'
        }}
      />
    </div>
  );
};
