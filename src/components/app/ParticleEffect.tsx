import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  angle: number;
  delay: number;
  size: number;
}

interface ParticleEffectProps {
  trigger: boolean;
  count?: number;
  color?: string;
  className?: string;
}

/**
 * Particle burst animation for celebrations
 * Triggers a burst of particles radiating outward
 */
export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  trigger,
  count = 12,
  color = 'hsl(var(--neon-cyan))',
  className
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true);
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (360 / count) * i,
        delay: Math.random() * 0.1,
        size: 4 + Math.random() * 4
      }));
      setParticles(newParticles);

      // Cleanup after animation
      setTimeout(() => {
        setParticles([]);
        setIsAnimating(false);
      }, 1200);
    }
  }, [trigger, count, isAnimating]);

  if (particles.length === 0) return null;

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-visible', className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute left-1/2 top-1/2 rounded-full animate-particle-burst"
          style={{
            '--particle-angle': `${particle.angle}deg`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
            animationDelay: `${particle.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
