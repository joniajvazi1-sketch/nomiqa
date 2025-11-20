import { useEffect, useState } from "react";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  scale: number;
}

export const Confetti = ({ trigger, onComplete }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger) {
      const confettiPieces = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1.5,
        color: ['hsl(45, 100%, 60%)', 'hsl(280, 85%, 65%)', 'hsl(340, 90%, 60%)', 'hsl(180, 75%, 55%)', 'hsl(25, 95%, 58%)'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5
      }));
      setPieces(confettiPieces);
      
      setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);
    }
  }, [trigger, onComplete]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            width: '12px',
            height: '12px',
            boxShadow: `0 0 10px ${piece.color}`,
          }}
        />
      ))}
    </div>
  );
};
