import { motion } from 'framer-motion';
import { Download, ShieldAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface ForceUpdateScreenProps {
  currentVersion: string;
  minVersion: string;
}

export const ForceUpdateScreen = ({ currentVersion, minVersion }: ForceUpdateScreenProps) => {
  const isIOS = Capacitor.getPlatform() === 'ios';

  const handleUpdate = () => {
    const url = isIOS
      ? 'https://apps.apple.com/app/nomiqa/id6743127044'
      : 'https://play.google.com/store/apps/details?id=com.nomiqa.app';

    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      style={{ touchAction: 'none' }}
    >
      <div className="max-w-xs text-center px-6 space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Update Required</h1>
          <p className="text-sm text-muted-foreground">
            Your app version ({currentVersion}) is outdated. Please update to version {minVersion} or later to continue earning rewards.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Your network contributions are still being recorded. Update now to resume earning points.
        </p>

        <button
          onClick={handleUpdate}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Download className="w-5 h-5" />
          Update Now
        </button>
      </div>
    </motion.div>
  );
};
