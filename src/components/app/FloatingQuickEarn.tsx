import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';

interface FloatingQuickEarnProps {
  isSessionActive?: boolean;
  livePoints?: number;
}

export const FloatingQuickEarn = ({ isSessionActive = false, livePoints = 0 }: FloatingQuickEarnProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { impact, buttonTap } = useEnhancedHaptics();
  const { playPop } = useEnhancedSounds();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show on the network contribution page
  if (location.pathname === '/app/map') {
    return null;
  }

  const handlePress = () => {
    buttonTap();
    playPop();
    
    if (isSessionActive) {
      setIsExpanded(!isExpanded);
    } else {
      navigate('/app/map');
    }
  };

  const handleNavigate = () => {
    buttonTap();
    navigate('/app/map');
  };

  return (
    <div className="fixed bottom-24 right-4 z-40">
      <AnimatePresence>
        {isExpanded && isSessionActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl min-w-[200px]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Active Session</span>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-lg font-bold text-primary">{livePoints} pts</span>
              <span className="text-sm text-muted-foreground">earned</span>
            </div>

            <button
              onClick={handleNavigate}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handlePress}
        whileTap={{ scale: 0.9 }}
        className={`
          relative flex items-center justify-center
          w-14 h-14 rounded-full shadow-lg
          ${isSessionActive 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
          }
        `}
      >
        {/* Pulse animation ring - red when not active */}
        {!isSessionActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/40"
              animate={{
                scale: [1, 1.5, 1.5],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/30"
              animate={{
                scale: [1, 1.8, 1.8],
                opacity: [0.4, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.3,
              }}
            />
          </>
        )}

        {/* Active session indicator */}
        {isSessionActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-[10px] font-bold text-green-500">{livePoints}</span>
          </motion.div>
        )}

        <Zap className="w-6 h-6" fill={isSessionActive ? 'white' : 'currentColor'} />
      </motion.button>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap"
      >
        <span className={`backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm ${
          isSessionActive 
            ? 'bg-green-500/20 border-green-500/40 text-green-400' 
            : 'bg-red-500/20 border-red-500/40 text-red-400'
        }`}>
          {isSessionActive ? 'Contributing' : 'Start Contributing'}
        </span>
      </motion.div>
    </div>
  );
};
