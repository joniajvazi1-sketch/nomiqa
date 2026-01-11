import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glareEnabled?: boolean;
  perspective?: number;
}

/**
 * 3D Tilt Card component using framer-motion
 * Creates a premium "physical card" feeling on touch/hover
 */
export const TiltCard3D: React.FC<TiltCard3DProps> = ({
  children,
  className = '',
  maxTilt = 15,
  scale = 1.02,
  glareEnabled = true,
  perspective = 1000
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth spring physics for natural feel
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 300,
    damping: 30
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 300,
    damping: 30
  });
  
  // Glare effect position
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);
  const glareOpacity = useTransform(
    [x, y],
    ([latestX, latestY]) => {
      const dist = Math.sqrt(
        Math.pow(latestX as number, 2) + Math.pow(latestY as number, 2)
      );
      return Math.min(dist * 0.5, 0.25);
    }
  );

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize to -0.5 to 0.5 range
    const normalizedX = (clientX - centerX) / rect.width;
    const normalizedY = (clientY - centerY) / rect.height;
    
    x.set(normalizedX);
    y.set(normalizedY);
  }, [x, y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMove]);

  const handleEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleLeave = useCallback(() => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={cardRef}
      className={cn('relative', className)}
      style={{
        perspective,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        animate={{
          scale: isHovered ? scale : 1
        }}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 30 }
        }}
        className="relative w-full h-full"
      >
        {children}
        
        {/* Glare overlay */}
        {glareEnabled && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
            style={{
              opacity: glareOpacity,
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.4) 0%, transparent 50%)`
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default TiltCard3D;
