import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Moon, 
  Battery, 
  Shield, 
  ChevronRight,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';

interface BackgroundLocationRationaleProps {
  isOpen: boolean;
  onRequestAlways: () => void;
  onSkip: () => void;
  onClose: () => void;
}

/**
 * Apple-compliant rationale screen for requesting "Always" location permission
 * Must be shown BEFORE calling requestBackgroundPermission() on iOS
 * 
 * Apple Guidelines:
 * 1. Explain why you need background location
 * 2. Show user benefits
 * 3. Give user choice to proceed or skip
 * 4. Only then trigger the system permission dialog
 */
export const BackgroundLocationRationale: React.FC<BackgroundLocationRationaleProps> = ({
  isOpen,
  onRequestAlways,
  onSkip,
  onClose
}) => {
  const { mediumTap } = useHaptics();

  const benefits = [
    {
      icon: Moon,
      title: 'Earn while you sleep',
      description: 'Keep collecting coverage data even when your phone is locked or in your pocket'
    },
    {
      icon: MapPin,
      title: 'Continuous mapping',
      description: 'Build more complete coverage maps as you travel throughout your day'
    },
    {
      icon: Battery,
      title: 'Battery optimized',
      description: 'We use iOS significant-location updates to minimize battery impact'
    },
    {
      icon: Shield,
      title: 'Full privacy control',
      description: 'You can revoke this permission anytime in Settings'
    }
  ];

  const handleRequestAlways = () => {
    mediumTap();
    onRequestAlways();
  };

  const handleSkip = () => {
    mediumTap();
    onSkip();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 bg-gradient-to-b from-[#1a1f2e] to-[#0f1419] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#00d4ff]/5 flex items-center justify-center border border-[#00d4ff]/30">
                <MapPin className="w-8 h-8 text-[#00d4ff]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Enable Background Location
              </h2>
              <p className="text-sm text-white/60">
                Earn points even when the app is closed
              </p>
            </div>

            {/* Benefits */}
            <div className="px-6 pb-4 space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-[#00d4ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{benefit.title}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* iOS Instruction */}
            <div className="mx-6 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-300 text-center leading-relaxed">
                <strong>Next step:</strong> When prompted, select <span className="font-semibold">"Change to Always Allow"</span> to enable background collection
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-8 space-y-3">
              <Button
                onClick={handleRequestAlways}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00b4d8] hover:from-[#00b4d8] hover:to-[#00d4ff] text-[#0a0f1a] font-semibold transition-all"
              >
                <span>Enable Background Location</span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              
              <button
                onClick={handleSkip}
                className="w-full py-3 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Not now, continue with limited tracking
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackgroundLocationRationale;
