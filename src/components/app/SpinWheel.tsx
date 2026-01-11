import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, Star, Sparkles, X } from 'lucide-react';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SpinWheelProps {
  userId: string;
  onClose: () => void;
  onPrizeWon?: (prize: { type: string; value: number }) => void;
}

const PRIZES = [
  { type: 'points', value: 5, label: '5', color: 'from-blue-500 to-cyan-500', weight: 30 },
  { type: 'points', value: 10, label: '10', color: 'from-green-500 to-emerald-500', weight: 25 },
  { type: 'points', value: 15, label: '15', color: 'from-yellow-500 to-amber-500', weight: 20 },
  { type: 'points', value: 25, label: '25', color: 'from-orange-500 to-red-500', weight: 12 },
  { type: 'points', value: 50, label: '50', color: 'from-purple-500 to-violet-500', weight: 8 },
  { type: 'jackpot', value: 100, label: '100', color: 'from-pink-500 to-rose-500', weight: 5 },
];

const SEGMENT_ANGLE = 360 / PRIZES.length;

export const SpinWheel = ({ userId, onClose, onPrizeWon }: SpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<typeof PRIZES[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const { successPattern, milestonePattern } = useEnhancedHaptics();
  const { playCelebration, playCoin } = useEnhancedSounds();

  const getRandomPrize = useCallback(() => {
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < PRIZES.length; i++) {
      random -= PRIZES[i].weight;
      if (random <= 0) return { prize: PRIZES[i], index: i };
    }
    return { prize: PRIZES[0], index: 0 };
  }, []);

  const handleSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);

    // Get random prize
    const { prize, index } = getRandomPrize();
    
    // Calculate rotation to land on prize
    const targetAngle = 360 - (index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + (spins * 360) + targetAngle;
    
    setRotation(finalRotation);

    // Wait for spin to complete
    setTimeout(async () => {
      setWonPrize(prize);
      setIsSpinning(false);
      
      if (prize.type === 'jackpot') {
        milestonePattern();
        playCelebration();
      } else {
        successPattern();
        playCoin();
      }

      // Save result to database
      try {
        const today = new Date().toISOString().split('T')[0];
        
        await supabase
          .from('spin_wheel_results')
          .insert({
            user_id: userId,
            spin_date: today,
            prize_type: prize.type,
            prize_value: prize.value,
            claimed: true,
          });

        const { data: userPoints } = await supabase
          .from('user_points')
          .select('total_points, pending_points')
          .eq('user_id', userId)
          .maybeSingle();

        if (userPoints) {
          await supabase
            .from('user_points')
            .update({
              total_points: (userPoints.total_points || 0) + prize.value,
              pending_points: (userPoints.pending_points || 0) + prize.value,
            })
            .eq('user_id', userId);
        }

        onPrizeWon?.({ type: prize.type, value: prize.value });
      } catch (error) {
        console.error('Error saving spin result:', error);
      }

      setShowResult(true);
    }, 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-card rounded-2xl p-4 shadow-2xl border border-border max-w-[280px] w-full max-h-[75vh] overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title - compact */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Daily Spin
          </h2>
          <p className="text-[10px] text-muted-foreground">Spin to win bonus points!</p>
        </div>

        {/* Wheel container - smaller */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
          </div>

          {/* Wheel */}
          <motion.div
            ref={wheelRef}
            className="w-full h-full rounded-full relative overflow-hidden border-4 border-white/20 shadow-xl"
            style={{ rotate: rotation }}
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {PRIZES.map((prize, index) => (
              <div
                key={index}
                className={cn(
                  "absolute w-full h-full origin-center",
                  `bg-gradient-to-br ${prize.color}`
                )}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan(Math.PI / PRIZES.length)}% 0%)`,
                  transform: `rotate(${index * SEGMENT_ANGLE}deg)`,
                }}
              >
                <div
                  className="absolute text-white text-[10px] font-bold"
                  style={{
                    top: '22%',
                    left: '50%',
                    transform: `translateX(-50%) rotate(${SEGMENT_ANGLE / 2}deg)`,
                  }}
                >
                  {prize.label}
                </div>
              </div>
            ))}
            
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border-4 border-white/30 flex items-center justify-center shadow-lg">
              <Gift className="w-4 h-4 text-primary" />
            </div>
          </motion.div>
        </div>

        {/* Result or Spin button */}
        <AnimatePresence mode="wait">
          {showResult && wonPrize ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <div className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white mb-3",
                `bg-gradient-to-r ${wonPrize.color}`
              )}>
                {wonPrize.type === 'jackpot' ? (
                  <Star className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                You won {wonPrize.label} pts!
              </div>
              <button
                onClick={onClose}
                className="block w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                Awesome!
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="spin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleSpin}
              disabled={isSpinning}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-base transition-all",
                isSpinning
                  ? "bg-muted text-muted-foreground"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              )}
            >
              {isSpinning ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Spinning...
                </span>
              ) : (
                'SPIN!'
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
