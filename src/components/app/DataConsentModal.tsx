import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, Signal, Zap, Clock, Lock, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const CONSENT_KEY = 'nomiqa_data_consent';
const CONSENT_VERSION = '1.0'; // Bump this to re-prompt users

interface ConsentState {
  version: string;
  consentedAt: string;
  dataCollection: boolean;
  anonymization: boolean;
}

interface DataConsentModalProps {
  onConsentComplete: () => void;
}

/**
 * GDPR-compliant data consent modal
 * Styled to match the mobile app theme with safe-area awareness
 */
export const DataConsentModal: React.FC<DataConsentModalProps> = ({ onConsentComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [anonymizationConsent, setAnonymizationConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented to current version
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const consent: ConsentState = JSON.parse(stored);
        if (consent.version === CONSENT_VERSION && consent.dataCollection) {
          // Already consented to current version
          return;
        }
      }
      // Need consent
      setIsOpen(true);
    } catch {
      setIsOpen(true);
    }
  }, []);

  const handleConsent = () => {
    if (!dataConsent || !anonymizationConsent) return;

    const consentState: ConsentState = {
      version: CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
      dataCollection: true,
      anonymization: true,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentState));
    setIsOpen(false);
    onConsentComplete();
  };

  const handleDecline = () => {
    // User can still use the app but won't earn points
    setIsOpen(false);
    onConsentComplete();
  };

  const canConsent = dataConsent && anonymizationConsent;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Header - Fixed at top */}
          <div 
            className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Data Collection</h1>
                  <p className="text-xs text-muted-foreground">Review before continuing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div 
            className="flex-1 overflow-y-auto px-4 pb-32"
            style={{ 
              height: 'calc(100vh - 180px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="py-6 space-y-6">
              {/* Intro text */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                Before you start contributing, please review what data we collect and how it's used.
              </p>

              {/* What we collect */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">What We Collect</h2>
                
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Approximate Location</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Rounded to ~150m accuracy (geohash). Not your exact position.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-b border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <Signal className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Network Signal Quality</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Signal strength, carrier name, network type (4G/5G).</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Connection Speed</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Download/upload speed and latency (when you run speed tests).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it's used */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">How It's Used</h2>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your anonymized data is aggregated with other users to create coverage maps. 
                    This helps telecom companies improve network quality in your area.
                  </p>
                </div>
              </div>

              {/* Retention & Rights */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Retention & Rights</h2>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Data Retention: 90 Days</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Raw data is automatically deleted after 90 days. Aggregated statistics are kept longer.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Lock className="h-4 w-4 text-cyan-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Your Rights</p>
                        <p className="text-muted-foreground text-xs mt-0.5">You can export or delete all your data at any time from Settings → Privacy.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consent checkboxes */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Your Consent</h2>
                
                <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox 
                      id="data-consent" 
                      checked={dataConsent} 
                      onCheckedChange={(checked) => setDataConsent(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground leading-relaxed">
                      I understand and consent to the collection of location and network data as described above.
                    </span>
                  </label>

                  <div className="border-t border-border/50" />

                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox 
                      id="anonymization-consent" 
                      checked={anonymizationConsent} 
                      onCheckedChange={(checked) => setAnonymizationConsent(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground leading-relaxed">
                      I consent to my anonymized data being aggregated and shared with third parties for network analysis.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky bottom action bar */}
          <div 
            className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="px-4 py-4 flex gap-3">
              <button
                onClick={handleDecline}
                className={cn(
                  "flex-1 h-14 rounded-2xl font-semibold text-base",
                  "bg-card border-2 border-border text-foreground",
                  "active:scale-[0.98] transition-all"
                )}
              >
                Decline
              </button>
              <button
                onClick={handleConsent}
                disabled={!canConsent}
                className={cn(
                  "flex-1 h-14 rounded-2xl font-semibold text-base",
                  "bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/20",
                  "active:scale-[0.98] transition-all",
                  !canConsent && "opacity-50 cursor-not-allowed"
                )}
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Check if user has given consent
 */
export const hasDataConsent = (): boolean => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;
    const consent: ConsentState = JSON.parse(stored);
    return consent.version === CONSENT_VERSION && consent.dataCollection;
  } catch {
    return false;
  }
};

/**
 * Clear consent (for testing or re-prompting)
 */
export const clearDataConsent = (): void => {
  localStorage.removeItem(CONSENT_KEY);
};

export default DataConsentModal;
