import { useEffect, useRef } from 'react';

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

export const NetworkBackground = ({ color }: NetworkBackgroundProps = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isVisibleRef = useRef(true);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Optimized node count based on device
    const nodeCount = isMobile() ? 25 : 35;
    const nodes: Node[] = [];
    const maxDistance = 150;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    // Visibility change handler - pause when tab is hidden
    const handleVisibilityChange = () => {
      isPausedRef.current = document.hidden;
      if (!document.hidden && isVisibleRef.current) {
        // Resume animation when tab becomes visible
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

    // Animation loop
    const animate = () => {
      // Don't animate if paused or not visible
      if (isPausedRef.current || !isVisibleRef.current) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep within bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Draw connections
        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.3;
            ctx.beginPath();
            ctx.strokeStyle = color ? `${color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)}` : `rgba(147, 51, 234, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = color ? `${color.replace('rgb(', 'rgba(').replace(')', ', 0.6)')}` : 'rgba(147, 51, 234, 0.6)';
        ctx.fill();
        
        // Add glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color ? `${color.replace('rgb(', 'rgba(').replace(')', ', 0.2)')}` : 'rgba(147, 51, 234, 0.2)';
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-40"
      style={{ pointerEvents: 'none' }}
    />
  );
};
