import { useEffect } from 'react';
import { Smartphone, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Mobile Only Page
 * 
 * Shown when users try to access /app/* routes from a web browser.
 * The app UI is only available in the installed native app (Capacitor).
 */
const MobileOnly = () => {
  // Try to detect if this is iOS or Android for app store links
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Deep link to try opening the app
  const handleOpenApp = () => {
    window.location.href = 'com.nomiqa.app://app';
    
    // Fallback to app store after a delay if app doesn't open
    setTimeout(() => {
      if (isIOS) {
        // iOS App Store link (update with actual App Store ID when available)
        window.location.href = 'https://nomiqa.lovable.app/download';
      } else if (isAndroid) {
        // Google Play Store link (update with actual Play Store ID when available)
        window.location.href = 'https://nomiqa.lovable.app/download';
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">
            Nomiqa is a Mobile App
          </h1>
          <p className="text-muted-foreground">
            Download the Nomiqa app to earn rewards, contribute to the network, and shop for global eSIMs.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {(isIOS || isAndroid) && (
            <Button 
              onClick={handleOpenApp}
              size="lg"
              className="w-full gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Open in Nomiqa App
            </Button>
          )}
          
          <Button 
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={() => window.location.href = '/download'}
          >
            <Download className="w-5 h-5" />
            Download the App
          </Button>
        </div>

        {/* Features preview */}
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">What you can do in the app:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Earn rewards
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Map coverage
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Buy eSIMs
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Join challenges
            </div>
          </div>
        </div>

        {/* Back to website */}
        <div className="pt-4">
          <a 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
};

export default MobileOnly;
