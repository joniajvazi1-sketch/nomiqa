import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Sparkles, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface IndoorModeToggleProps {
  isIndoor: boolean;
  onToggle: (indoor: boolean) => void;
  disabled?: boolean;
  gpsAccuracy?: number;
}

export const IndoorModeToggle: React.FC<IndoorModeToggleProps> = ({
  isIndoor,
  onToggle,
  disabled = false,
  gpsAccuracy
}) => {
  const { mediumTap } = useHaptics();

  // Auto-detect indoor based on GPS accuracy (>30m suggests indoor)
  const isAutoIndoor = gpsAccuracy !== undefined && gpsAccuracy > 30;

  const handleToggle = () => {
    if (disabled) return;
    mediumTap();
    onToggle(!isIndoor);
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl',
        'backdrop-blur-xl border transition-all duration-300',
        'active:scale-[0.98]',
        isIndoor
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/40'
          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
        isIndoor
          ? 'bg-amber-500/20 border border-amber-500/30'
          : 'bg-white/5 border border-white/10'
      )}>
        <Building2 className={cn(
          'w-5 h-5 transition-colors',
          isIndoor ? 'text-amber-400' : 'text-muted-foreground'
        )} />
      </div>

      {/* Label */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-semibold text-sm',
            isIndoor ? 'text-amber-200' : 'text-foreground'
          )}>
            Indoor Mode
          </span>
          {isIndoor && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold"
            >
              <Sparkles className="w-2.5 h-2.5" />
              1.5x
            </motion.span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {isIndoor 
            ? 'Earning 1.5x points for indoor data'
            : isAutoIndoor 
              ? 'Indoor detected - tap to enable bonus'
              : 'Enable for 1.5x indoor bonus'
          }
        </div>
      </div>

      {/* Toggle switch */}
      <div className={cn(
        'w-12 h-7 rounded-full p-1 transition-all duration-300',
        isIndoor
          ? 'bg-amber-500 shadow-lg shadow-amber-500/30'
          : 'bg-white/10'
      )}>
        <motion.div
          className="w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ x: isIndoor ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>

      {/* Auto-detect indicator */}
      <AnimatePresence>
        {isAutoIndoor && !isIndoor && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 animate-pulse"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Compact version for status bar
export const IndoorModeIndicator: React.FC<{ isIndoor: boolean }> = ({ isIndoor }) => {
  if (!isIndoor) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30"
    >
      <Building2 className="w-3 h-3 text-amber-400" />
      <span className="text-[10px] font-bold text-amber-400">INDOOR</span>
      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
    </motion.div>
  );
};
