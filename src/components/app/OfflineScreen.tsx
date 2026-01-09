import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/contexts/TranslationContext';
import { useHaptics } from '@/hooks/useHaptics';

/**
 * Full-screen offline blocker
 * Displayed when the app has no internet connection
 */
export const OfflineScreen: React.FC = () => {
  const { t } = useTranslation();
  const { mediumTap } = useHaptics();

  const handleRetry = () => {
    mediumTap();
    // Force a reload to check connection
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-neon-cyan/5 pointer-events-none" />
      
      {/* Animated WiFi icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-8"
      >
        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-32 h-32 rounded-full border-2 border-muted-foreground/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-24 h-24 rounded-full border-2 border-muted-foreground/30"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </div>
        
        {/* Main icon container */}
        <div className="w-24 h-24 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-muted-foreground" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl font-bold text-foreground mb-3 text-center"
      >
        {t('app.offline.title') || 'No Internet Connection'}
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-muted-foreground text-center mb-8 max-w-xs"
      >
        {t('app.offline.description') || 'Please check your connection and try again. The app requires an internet connection to work.'}
      </motion.p>

      {/* Retry button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        onClick={handleRetry}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 active:scale-95 transition-all"
      >
        <RefreshCw className="w-5 h-5" />
        {t('app.offline.retry') || 'Try Again'}
      </motion.button>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-6 text-xs text-muted-foreground/60 text-center"
      >
        {t('app.offline.hint') || 'Make sure Wi-Fi or mobile data is turned on'}
      </motion.p>
    </div>
  );
};
