import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, MapPin, Signal, Zap, Clock, Lock } from 'lucide-react';

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
 * Shows exactly what data is collected, how it's used, and retention policies
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Data Collection Consent
          </DialogTitle>
          <DialogDescription>
            Before you start contributing, please review what data we collect and how it's used.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What we collect */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">What We Collect</h4>
            
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Approximate Location</p>
                <p className="text-muted-foreground text-xs">Rounded to ~150m accuracy (geohash). Not your exact position.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Signal className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Network Signal Quality</p>
                <p className="text-muted-foreground text-xs">Signal strength, carrier name, network type (4G/5G).</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Zap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Connection Speed</p>
                <p className="text-muted-foreground text-xs">Download/upload speed and latency (when you run speed tests).</p>
              </div>
            </div>
          </div>

          {/* How it's used */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-semibold text-sm">How It's Used</h4>
            <p className="text-sm text-muted-foreground">
              Your anonymized data is aggregated with other users to create coverage maps. 
              This helps telecom companies improve network quality in your area.
            </p>
          </div>

          {/* Retention */}
          <div className="flex items-start gap-3 text-sm border-t pt-4">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Data Retention: 90 Days</p>
              <p className="text-muted-foreground text-xs">Raw data is automatically deleted after 90 days. Aggregated statistics are kept longer.</p>
            </div>
          </div>

          {/* Your rights */}
          <div className="flex items-start gap-3 text-sm border-t pt-4">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Your Rights</p>
              <p className="text-muted-foreground text-xs">You can export or delete all your data at any time from Settings → Privacy.</p>
            </div>
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="data-consent" 
                checked={dataConsent} 
                onCheckedChange={(checked) => setDataConsent(checked === true)}
              />
              <label htmlFor="data-consent" className="text-sm cursor-pointer">
                I understand and consent to the collection of location and network data as described above.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="anonymization-consent" 
                checked={anonymizationConsent} 
                onCheckedChange={(checked) => setAnonymizationConsent(checked === true)}
              />
              <label htmlFor="anonymization-consent" className="text-sm cursor-pointer">
                I consent to my anonymized data being aggregated and shared with third parties for network analysis.
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={handleDecline} className="w-full sm:w-auto">
            Decline
          </Button>
          <Button onClick={handleConsent} disabled={!canConsent} className="w-full sm:w-auto">
            I Agree & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
