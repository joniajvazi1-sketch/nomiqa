import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Signal, ChevronRight } from 'lucide-react';

interface MiniContributionMapProps {
  className?: string;
  contributionPoints?: number;
  dataPointsCount?: number;
}

/**
 * Premium mini map preview for the home dashboard
 * Shows a stylized globe/network visualization
 */
export const MiniContributionMap: React.FC<MiniContributionMapProps> = ({ 
  className,
  contributionPoints = 0,
  dataPointsCount = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isVisible, setIsVisible] = useState(false);

  // Generate deterministic nodes based on contribution points
  const nodes = useMemo(() => {
    const count = Math.min(Math.max(8, Math.floor(contributionPoints / 100)), 25);
    const seed = (contributionPoints % 1000) + 1;
    const seededRandom = (i: number) => {
      const x = Math.sin(seed + i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    
    return Array.from({ length: count }, (_, i) => ({
      x: seededRandom(i * 3) * 0.8 + 0.1,
      y: seededRandom(i * 3 + 1) * 0.7 + 0.15,
      size: seededRandom(i * 3 + 2) * 3 + 2,
      pulse: seededRandom(i * 3 + 3) * Math.PI * 2,
      active: seededRandom(i * 3 + 4) > 0.5,
    }));
  }, [contributionPoints]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    let time = 0;

    const draw = () => {
      // Clear with gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, 'hsl(220, 25%, 6%)');
      bgGradient.addColorStop(0.5, 'hsl(220, 20%, 8%)');
      bgGradient.addColorStop(1, 'hsl(200, 25%, 7%)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid pattern
      ctx.strokeStyle = 'hsla(200, 50%, 30%, 0.08)';
      ctx.lineWidth = 0.5;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw connections between nearby nodes
      ctx.lineWidth = 1;
      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach((other) => {
          const dx = (node.x - other.x) * width;
          const dy = (node.y - other.y) * height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.25;
            const gradient = ctx.createLinearGradient(
              node.x * width, node.y * height,
              other.x * width, other.y * height
            );
            gradient.addColorStop(0, `hsla(180, 100%, 60%, ${alpha})`);
            gradient.addColorStop(1, `hsla(200, 100%, 50%, ${alpha * 0.5})`);
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(node.x * width, node.y * height);
            ctx.lineTo(other.x * width, other.y * height);
            ctx.stroke();
          }
        });
      });

      // Draw nodes with glow
      nodes.forEach((node) => {
        const x = node.x * width;
        const y = node.y * height;
        const pulseScale = 1 + Math.sin(time * 0.05 + node.pulse) * 0.3;
        const baseSize = node.size * pulseScale;

        // Outer glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, baseSize * 4);
        glowGradient.addColorStop(0, node.active ? 'hsla(180, 100%, 60%, 0.3)' : 'hsla(200, 80%, 50%, 0.2)');
        glowGradient.addColorStop(0.5, node.active ? 'hsla(180, 100%, 55%, 0.1)' : 'hsla(200, 70%, 45%, 0.05)');
        glowGradient.addColorStop(1, 'hsla(200, 60%, 40%, 0)');
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, baseSize, 0, Math.PI * 2);
        ctx.fillStyle = node.active ? 'hsl(180, 100%, 65%)' : 'hsl(200, 70%, 55%)';
        ctx.fill();
      });

      // Central radar pulse
      const centerX = width * 0.5;
      const centerY = height * 0.45;
      const pulseProgress = (time % 120) / 120;
      const pulseRadius = pulseProgress * 60;
      const pulseAlpha = (1 - pulseProgress) * 0.4;

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(180, 100%, 65%, ${pulseAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Second pulse (offset)
      const pulse2Progress = ((time + 60) % 120) / 120;
      const pulse2Radius = pulse2Progress * 60;
      const pulse2Alpha = (1 - pulse2Progress) * 0.3;

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulse2Radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(180, 100%, 65%, ${pulse2Alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      time++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes]);

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-500',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Center beacon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none">
        <div className="relative">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 w-10 h-10 -m-1 rounded-full bg-neon-cyan/20 animate-ping" style={{ animationDuration: '2s' }} />
          {/* Inner glow */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/30 to-sky-500/20 backdrop-blur-sm border border-neon-cyan/40 flex items-center justify-center shadow-lg shadow-neon-cyan/30">
            <Signal className="w-4 h-4 text-neon-cyan" />
          </div>
        </div>
      </div>
      
      {/* Top gradient fade */}
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-background/40 to-transparent pointer-events-none" />
      
      {/* Bottom info bar */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neon-cyan/15 flex items-center justify-center">
              <MapPin className="w-3 h-3 text-neon-cyan" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Network Coverage</div>
              {dataPointsCount > 0 && (
                <div className="text-[10px] text-muted-foreground">
                  {dataPointsCount.toLocaleString()} data points collected
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-neon-cyan">
            <span className="text-xs font-medium">Explore</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-neon-cyan/30 rounded-tl-lg pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-neon-cyan/30 rounded-tr-lg pointer-events-none" />
    </div>
  );
};

export default MiniContributionMap;