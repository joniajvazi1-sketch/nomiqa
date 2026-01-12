import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Shield, Coins, ChevronRight, AlertCircle } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface LocationPermissionRequestProps {
  onPermissionGranted: () => void;
  onSkip: () => void;
}

export const LocationPermissionRequest: React.FC<LocationPermissionRequestProps> = ({
  onPermissionGranted,
  onSkip,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mediumTap, success } = useHaptics();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(null);
    mediumTap();

    try {
      const permission = await Geolocation.requestPermissions();
      
      if (permission.location === 'granted') {
        success();
        onPermissionGranted();
      } else {
        setError('Location permission denied. You can enable it later in settings.');
      }
    } catch (err) {
      console.error('Permission request error:', err);
      setError('Unable to request permissions. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const benefits = [
    {
      icon: Coins,
      title: 'Earn Continuously',
      description: 'Collect points 24/7 as you move around',
    },
    {
      icon: MapPin,
      title: 'Map Coverage',
      description: 'Help improve network quality in your area',
    },
    {
      icon: Shield,
      title: 'Privacy Protected',
      description: 'Data is anonymized – never linked to you',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center px-6 py-8 min-h-full"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-primary" strokeWidth={1.5} />
          </div>
          {/* Animated rings */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-primary/30"
            animate={{ scale: [1, 1.3, 1.3], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-primary/30"
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground text-center mb-2"
      >
        Enable Location Access
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-muted-foreground text-center mb-8 max-w-[280px]"
      >
        Allow location so we can measure signal quality and reward you with points wherever you go.
      </motion.p>

      {/* Benefits list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-[320px] space-y-3 mb-8"
      >
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <benefit.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4 w-full max-w-[320px]"
        >
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-[320px] space-y-3"
      >
        <button
          onClick={handleRequestPermission}
          disabled={isRequesting}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-sm",
            "flex items-center justify-center gap-2",
            "bg-primary text-primary-foreground",
            "active:scale-[0.98] transition-transform",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isRequesting ? (
            <motion.div
              className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <>
              Enable Location
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="w-full h-10 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe Later
        </button>
      </motion.div>

      {/* Privacy note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-[10px] text-muted-foreground/60 text-center mt-6 max-w-[280px]"
      >
        We never store personal data. Location is used only to measure network quality and is immediately anonymized.
      </motion.p>
    </motion.div>
  );
};

export default LocationPermissionRequest;
