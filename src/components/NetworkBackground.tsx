import { useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface NetworkBackgroundProps {
  color?: string;
}

// Detect mobile device
const isMobile = () => {
  return typeof window !== 'undefined' && (
    window.innerWidth < 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

// Check for reduced motion preference
const prefersReducedMotion = () => {
  return typeof window !== 'undefined' && 
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
};

export const NetworkBackground = ({ color }: NetworkBackgroundProps = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isVisibleRef = useRef(true);
  const isPausedRef = useRef(false);
  const nodesRef = useRef<Node[]>([]);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Skip on mobile for performance - use CSS gradient fallback
    if (isMobile() || prefersReducedMotion()) {
      setShouldRender(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size with device pixel ratio consideration
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    
    // Debounced resize handler
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Reduced node count for better performance
    const nodeCount = 20;
    const maxDistance = 120;

    // Initialize nodes only once
    if (nodesRef.current.length === 0) {
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        });
      }
    }

    const nodes = nodesRef.current;

    // Visibility change handler - pause when tab is hidden
    const handleVisibilityChange = () => {
      isPausedRef.current = document.hidden;
      if (!document.hidden && isVisibleRef.current) {
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // IntersectionObserver - pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !isPausedRef.current) {
          animate();
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(canvas);

    // Throttled animation loop (24fps for better battery - still smooth)
    let lastTime = 0;
    const frameInterval = 1000 / 24; // 24fps is plenty for ambient background
    let frameSkip = 0;

    const animate = (currentTime?: number) => {
      if (isPausedRef.current || !isVisibleRef.current) {
        return;
      }

      // Frame skip for ultra-smooth perceived animation
      if (currentTime && currentTime - lastTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime || 0;
      
      // Skip every other physics update for performance
      frameSkip = (frameSkip + 1) % 2;

      const width = window.innerWidth;
      const height = window.innerHeight;
      
      ctx.clearRect(0, 0, width, height);

      // Batch all drawing operations
      const nodeColor = color ? color.replace('rgb(', 'rgba(').replace(')', ', 0.4)') : 'rgba(147, 51, 234, 0.4)';

      // Update physics only on alternate frames
      if (frameSkip === 0) {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
          node.x = Math.max(0, Math.min(width, node.x));
          node.y = Math.max(0, Math.min(height, node.y));
        }
      }

      // Draw connections (simplified - fewer checks)
      const maxDistSq = maxDistance * maxDistance;
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const otherNode = nodes[j];
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const opacity = (1 - Math.sqrt(distSq) / maxDistance) * 0.2;
            ctx.strokeStyle = color 
              ? `${color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)}` 
              : `rgba(147, 51, 234, ${opacity})`;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
          }
        }
      }
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw nodes in single batch
      ctx.fillStyle = nodeColor;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, [color]);

  // Mobile fallback - simple CSS gradient instead of canvas
  if (!shouldRender) {
    return (
      <div 
        className="fixed inset-0 -z-10 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)'
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-30"
      style={{ pointerEvents: 'none', willChange: 'auto' }}
    />
  );
};
