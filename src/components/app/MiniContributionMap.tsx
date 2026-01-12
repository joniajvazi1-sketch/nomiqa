import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, ChevronRight } from 'lucide-react';

interface MiniContributionMapProps {
  className?: string;
  contributionPoints?: number;
  dataPointsCount?: number;
}

/**
 * Clean mini map preview for the home dashboard
 * Shows a stylized network visualization without decorative elements
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
    const count = Math.min(Math.max(8, Math.floor(contributionPoints / 100)), 20);
    const seed = (contributionPoints % 1000) + 1;
    const seededRandom = (i: number) => {
      const x = Math.sin(seed + i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    
    return Array.from({ length: count }, (_, i) => ({
      x: seededRandom(i * 3) * 0.8 + 0.1,
      y: seededRandom(i * 3 + 1) * 0.7 + 0.15,
      size: seededRandom(i * 3 + 2) * 2 + 2,
      pulse: seededRandom(i * 3 + 3) * Math.PI * 2,
      active: seededRandom(i * 3 + 4) > 0.5,
    }));
  }, [contributionPoints]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    let time = 0;

    const draw = () => {
      // Clear with solid background
      ctx.fillStyle = 'hsl(220, 20%, 6%)';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'hsla(200, 30%, 25%, 0.1)';
      ctx.lineWidth = 0.5;
      const gridSize = 24;
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

      // Draw connections
      ctx.lineWidth = 1;
      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach((other) => {
          const dx = (node.x - other.x) * width;
          const dy = (node.y - other.y) * height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 70) {
            const alpha = (1 - dist / 70) * 0.2;
            ctx.strokeStyle = `hsla(175, 70%, 50%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(node.x * width, node.y * height);
            ctx.lineTo(other.x * width, other.y * height);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        const x = node.x * width;
        const y = node.y * height;
        const pulseScale = 1 + Math.sin(time * 0.03 + node.pulse) * 0.2;
        const baseSize = node.size * pulseScale;

        // Glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, baseSize * 3);
        glowGradient.addColorStop(0, node.active ? 'hsla(175, 70%, 50%, 0.2)' : 'hsla(200, 60%, 45%, 0.15)');
        glowGradient.addColorStop(1, 'hsla(200, 60%, 40%, 0)');
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x, y, baseSize, 0, Math.PI * 2);
        ctx.fillStyle = node.active ? 'hsl(175, 70%, 55%)' : 'hsl(200, 50%, 50%)';
        ctx.fill();
      });

      // Central pulse
      const centerX = width * 0.5;
      const centerY = height * 0.45;
      const pulseProgress = (time % 100) / 100;
      const pulseRadius = pulseProgress * 50;
      const pulseAlpha = (1 - pulseProgress) * 0.3;

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(175, 70%, 55%, ${pulseAlpha})`;
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
        'relative overflow-hidden rounded-2xl border border-border transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Bottom info bar */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-3 h-3 text-primary" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Network Coverage</div>
              {dataPointsCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  {dataPointsCount.toLocaleString()} data points
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <span className="text-xs font-medium">Explore</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniContributionMap;
