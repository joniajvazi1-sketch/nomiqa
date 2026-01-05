import React from 'react';
import { cn } from '@/lib/utils';

interface OrbitingParticlesProps {
  isActive: boolean;
  count?: number;
  radius?: number;
  color?: string;
  className?: string;
}

/**
 * Orbiting particles around a central element
 * Used on the SignalQualityDial when actively scanning
 */
export const OrbitingParticles: React.FC<OrbitingParticlesProps> = ({
  isActive,
  count = 8,
  radius = 110,
  color = 'hsl(var(--neon-cyan))',
  className
}) => {
  if (!isActive) return null;

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {Array.from({ length: count }).map((_, i) => {
        const baseAngle = (360 / count) * i;
        const duration = 8 + Math.random() * 4;
        const size = 3 + Math.random() * 3;
        const opacity = 0.4 + Math.random() * 0.4;
        const delay = -(duration / count) * i;

        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              marginLeft: `-${size / 2}px`,
              marginTop: `-${size / 2}px`,
              animation: `orbit-particle ${duration}s linear infinite`,
              animationDelay: `${delay}s`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: color,
                opacity,
                boxShadow: `0 0 ${size * 2}px ${color}`,
                animation: `particle-pulse ${2 + Math.random()}s ease-in-out infinite`,
              }}
            />
          </div>
        );
      })}

      <style>{`
        @keyframes orbit-particle {
          from {
            transform: rotate(0deg) translateX(${radius}px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(${radius}px) rotate(-360deg);
          }
        }
        
        @keyframes particle-pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
};
