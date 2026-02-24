import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, Star, Sparkles, X, Trophy } from 'lucide-react';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SpinWheelProps {
  userId: string;
  onClose: () => void;
  onPrizeWon?: (prize: { type: string; value: number }) => void;
}

const PRIZES = [
  { type: 'points', value: 5, label: '5', color: '#3b82f6', bgColor: 'from-blue-500 to-blue-600', weight: 30 },
  { type: 'points', value: 10, label: '10', color: '#22c55e', bgColor: 'from-green-500 to-green-600', weight: 25 },
  { type: 'points', value: 15, label: '15', color: '#eab308', bgColor: 'from-yellow-500 to-yellow-600', weight: 20 },
  { type: 'points', value: 25, label: '25', color: '#f97316', bgColor: 'from-orange-500 to-orange-600', weight: 12 },
  { type: 'points', value: 50, label: '50', color: '#a855f7', bgColor: 'from-purple-500 to-purple-600', weight: 8 },
  { type: 'jackpot', value: 100, label: '💎', color: '#ec4899', bgColor: 'from-pink-500 to-rose-500', weight: 5 },
];

const SEGMENT_COUNT = PRIZES.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

// Create tick sound using Web Audio API
const createTickSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1200 + Math.random() * 200; // Slight pitch variation
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    // Silently fail if audio context not available
  }
};

export const SpinWheel = ({ userId, onClose, onPrizeWon }: SpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [displayRotation, setDisplayRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<typeof PRIZES[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const lastSegmentRef = useRef<number>(-1);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startRotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const { successPattern, milestonePattern, buttonTap } = useEnhancedHaptics();
  const { playCelebration, playCoin } = useEnhancedSounds();

  // Easing function for smooth deceleration
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  // Animation loop for smooth rotation with tick sounds
  const animateWheel = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    
    const elapsed = timestamp - startTimeRef.current;
    const duration = 4000; // 4 seconds total
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(progress);
    
    const totalRotation = targetRotationRef.current - startRotationRef.current;
    const currentRotation = startRotationRef.current + (totalRotation * easedProgress);
    
    setDisplayRotation(currentRotation);
    
    // Calculate current segment (normalize to 0-360 and find segment)
    const normalizedAngle = ((currentRotation % 360) + 360) % 360;
    const currentSegment = Math.floor(normalizedAngle / SEGMENT_ANGLE);
    
    // Play tick when crossing segment boundary
    if (currentSegment !== lastSegmentRef.current && lastSegmentRef.current !== -1) {
      createTickSound();
    }
    lastSegmentRef.current = currentSegment;
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateWheel);
    }
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
    lastSegmentRef.current = -1;

    const { prize, index } = getRandomPrize();
    
    // Calculate rotation - pointer is at top, segments start from top going clockwise
    const targetAngle = 360 - (index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = displayRotation + (spins * 360) + targetAngle;
    
    // Setup animation
    startTimeRef.current = 0;
    startRotationRef.current = displayRotation;
    targetRotationRef.current = finalRotation;
    setRotation(finalRotation);
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animateWheel);

    setTimeout(async () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setWonPrize(prize);
      setIsSpinning(false);
      
      if (prize.type === 'jackpot') {
        milestonePattern();
        playCelebration();
      } else {
        successPattern();
        playCoin();
      }

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

        // Use add_referral_points RPC to bypass daily cap but enforce lifetime cap
        const { data: pointsResult, error: rpcError } = await supabase.rpc('add_referral_points', {
          p_user_id: userId,
          p_points: prize.value,
          p_source: 'spin_wheel'
        });

        if (rpcError) {
          console.error('[SpinWheel] Failed to award points via RPC:', rpcError);
        }

        onPrizeWon?.({ type: prize.type, value: prize.value });
      } catch (error) {
        console.error('Error saving spin result:', error);
      }

      setShowResult(true);
    }, 4000);
  };

  // Generate SVG wheel segments
  const generateWheelSegments = () => {
    const segments = [];
    const radius = 120;
    const centerX = 120;
    const centerY = 120;

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = SEGMENT_ANGLE > 180 ? 1 : 0;
      
      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      // Text position
      const textAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const textRadius = radius * 0.65;
      const textX = centerX + textRadius * Math.cos(textAngle);
      const textY = centerY + textRadius * Math.sin(textAngle);
      const textRotation = (i + 0.5) * SEGMENT_ANGLE;
      
      segments.push(
        <g key={i}>
          <path
            d={pathData}
            fill={PRIZES[i].color}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize="18"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            {PRIZES[i].label}
          </text>
        </g>
      );
    }
    return segments;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-b from-card to-background rounded-3xl p-6 shadow-2xl border border-border max-w-[320px] w-full overflow-visible"
      >
        {/* Decorative glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50" />
        
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-3"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Daily Bonus</span>
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">Spin & Win!</h2>
            <p className="text-sm text-muted-foreground mt-1">Try your luck for bonus points</p>
          </div>

          {/* Wheel Container */}
          <div className="relative w-[240px] h-[240px] mx-auto mb-6">
            {/* Outer ring glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-pink-500/30 blur-md" />
            
            {/* Outer decorative ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/10 shadow-2xl">
              {/* Tick marks around the wheel */}
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-2 bg-white/30 rounded-full"
                  style={{
                    top: '2px',
                    left: '50%',
                    transformOrigin: '50% 120px',
                    transform: `translateX(-50%) rotate(${i * 15}deg)`,
                  }}
                />
              ))}
            </div>
            
            {/* Pointer with glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <div className="relative">
                <div className="absolute inset-0 blur-sm">
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-amber-400" />
                </div>
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-500 drop-shadow-lg" />
              </div>
            </div>

            {/* SVG Wheel */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden shadow-inner"
              style={{ transform: `rotate(${displayRotation}deg)` }}
            >
              <svg viewBox="0 0 240 240" className="w-full h-full">
                <defs>
                  <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                    <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
                    <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
                  </filter>
                </defs>
                <g filter="url(#innerShadow)">
                  {generateWheelSegments()}
                </g>
              </svg>
            </div>
            
            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl border-4 border-white/30 z-10">
              <Gift className="w-7 h-7 text-white drop-shadow-md" />
            </div>

            {/* Spinning glow effect */}
            {isSpinning && (
              <motion.div 
                className="absolute inset-0 rounded-full"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(251,191,36,0.3)',
                    '0 0 40px rgba(251,191,36,0.5)',
                    '0 0 20px rgba(251,191,36,0.3)',
                  ]
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>

          {/* Result or Spin button */}
          <AnimatePresence mode="wait">
            {showResult && wonPrize ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                {/* Celebration burst */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="mb-4"
                >
                  <div className={cn(
                    "inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl text-white",
                    `bg-gradient-to-br ${wonPrize.bgColor}`
                  )}>
                    {wonPrize.type === 'jackpot' ? (
                      <Trophy className="w-8 h-8" />
                    ) : (
                      <Star className="w-8 h-8" />
                    )}
                    <div>
                      <p className="text-sm opacity-90">You won</p>
                      <p className="text-3xl font-bold">{wonPrize.value} pts</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
                >
                  Claim Reward
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="spin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleSpin}
                disabled={isSpinning}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden",
                  isSpinning
                    ? "bg-muted text-muted-foreground"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                )}
              >
                {/* Shine effect */}
                {!isSpinning && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}
                
                <span className="relative flex items-center justify-center gap-2">
                  {isSpinning ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Spinning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      SPIN TO WIN!
                    </>
                  )}
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Prize legend */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {PRIZES.slice(0, 6).map((prize, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: prize.color }}
                />
                <span>{prize.type === 'jackpot' ? '100 💎' : `${prize.value} pts`}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
