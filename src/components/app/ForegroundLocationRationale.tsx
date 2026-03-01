import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Signal, 
  Coins, 
  Shield, 
  ChevronRight,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';

interface ForegroundLocationRationaleProps {
  isOpen: boolean;
  onAllow: () => void;
  onSkip: () => void;
  onClose: () => void;
}

/**
 * Pre-permission explanation screen for foreground location (Step 1)
 * Must be shown BEFORE requesting "When In Use" / foreground location permission
 */
export const ForegroundLocationRationale: React.FC<ForegroundLocationRationaleProps> = ({
  isOpen,
  onAllow,
  onSkip,
  onClose
}) => {
  const { mediumTap } = useHaptics();

  const useCases = [
    {
      icon: Signal,
      title: 'Measure signal strength in your area',
    },
    {
      icon: MapPin,
      title: 'Map coverage quality',
    },
    {
      icon: Coins,
      title: 'Calculate contribution points',
    },
  ];

  const privacyPoints = [
    'Location is rounded before storage',
    'No phone numbers or contacts are collected',
    'Data is used only for network analysis',
  ];

  const handleAllow = () => {
    mediumTap();
    onAllow();
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
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
        >
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 bg-gradient-to-b from-[#1a1f2e] to-[#0f1419] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Header */}
              <div className="pt-8 pb-4 px-6 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#00d4ff]/5 flex items-center justify-center border border-[#00d4ff]/30">
                  <MapPin className="w-8 h-8 text-[#00d4ff]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Improve Mobile Network Coverage Together
                </h2>
                <p className="text-sm text-white/60 leading-relaxed">
                  Nomiqa measures real-world mobile network performance to identify coverage gaps and signal quality issues.
                </p>
                <p className="text-sm text-white/50 mt-2">
                  To contribute, we need access to your location while the app is in use.
                </p>
              </div>

              {/* Use cases */}
              <div className="px-6 pb-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Your location is used to</p>
                <div className="space-y-2">
                  {useCases.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.08 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                        <item.icon className="w-4.5 h-4.5 text-[#00d4ff]" />
                      </div>
                      <p className="text-sm text-white">{item.title}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="px-6 pb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Your privacy matters</p>
                  </div>
                  <ul className="space-y-1.5">
                    {privacyPoints.map((point) => (
                      <li key={point} className="text-xs text-white/50 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-white/40 mt-2">You can stop contributing anytime.</p>
                </div>
              </div>
            </div>

            {/* Fixed Actions */}
            <div className="shrink-0 px-6 pb-6 pt-4 bg-gradient-to-t from-[#0f1419] to-transparent">
              <Button
                onClick={handleAllow}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00b4d8] hover:from-[#00b4d8] hover:to-[#00d4ff] text-[#0a0f1a] font-semibold transition-all"
              >
                <span>Allow Location Access</span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              
              <button
                onClick={handleSkip}
                className="w-full py-3 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Not Now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForegroundLocationRationale;
