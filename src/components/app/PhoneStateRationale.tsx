import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Signal, 
  Radio, 
  ShieldCheck,
  ChevronRight,
  X,
  ShieldOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';

interface PhoneStateRationaleProps {
  isOpen: boolean;
  onAllow: () => void;
  onSkip: () => void;
  onClose: () => void;
}

/**
 * Pre-permission explanation screen for READ_PHONE_STATE (Step 3)
 * Addresses Play Store reviewer concerns about phone state access
 */
export const PhoneStateRationale: React.FC<PhoneStateRationaleProps> = ({
  isOpen,
  onAllow,
  onSkip,
  onClose
}) => {
  const { mediumTap } = useHaptics();

  const collectedMetrics = [
    'Signal strength (RSRP, RSRQ, RSSI, SINR)',
    'Network generation (5G, 4G, etc.)',
    'Carrier information',
    'Cell tower identifiers',
  ];

  const notCollected = [
    'Phone numbers',
    'IMEI',
    'Call logs',
    'SMS messages',
    'Contacts',
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
                  <Radio className="w-8 h-8 text-[#00d4ff]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Access Network Signal Metrics
                </h2>
                <p className="text-sm text-white/60 leading-relaxed">
                  To measure mobile network quality, Nomiqa reads signal and radio parameters from your device.
                </p>
              </div>

              {/* What we collect */}
              <div className="px-6 pb-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Signal className="w-4 h-4 text-[#00d4ff]" />
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">This includes</p>
                  </div>
                  <ul className="space-y-1.5">
                    {collectedMetrics.map((metric) => (
                      <li key={metric} className="text-xs text-white/70 flex items-start gap-2">
                        <span className="text-[#00d4ff] mt-0.5">•</span>
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* What we do NOT collect */}
              <div className="px-6 pb-4">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldOff className="w-4 h-4 text-red-400" />
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">We do NOT access</p>
                  </div>
                  <ul className="space-y-1.5">
                    {notCollected.map((item) => (
                      <li key={item} className="text-xs text-white/50 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Purpose note */}
              <div className="mx-6 mb-4 p-3 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00d4ff]" />
                  <p className="text-xs text-white/60 leading-relaxed">
                    This data is required for accurate coverage mapping.
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Actions */}
            <div className="shrink-0 px-6 pb-6 pt-4 bg-gradient-to-t from-[#0f1419] to-transparent">
              <Button
                onClick={handleAllow}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00b4d8] hover:from-[#00b4d8] hover:to-[#00d4ff] text-[#0a0f1a] font-semibold transition-all"
              >
                <span>Allow Signal Access</span>
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

export default PhoneStateRationale;
