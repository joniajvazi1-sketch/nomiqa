import { useEffect, useState } from "react";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const Confetti = ({ trigger, onComplete }: ConfettiProps) => {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

  useEffect(() => {
    if (trigger) {
      const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.5 + Math.random() * 1,
        color: ['hsl(25, 95%, 58%)', 'hsl(178, 65%, 52%)', 'hsl(145, 70%, 45%)', 'hsl(40, 100%, 93%)'][Math.floor(Math.random() * 4)]
      }));
      setPieces(confettiPieces);
      
      setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);
    }
  }, [trigger, onComplete]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
};
