import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * AffiliateRedirect - Secure handler for referral links
 * 
 * Uses secure RPC functions instead of direct table queries to prevent
 * exposure of affiliate email addresses and other sensitive data.
 * 
 * Supports two URL formats:
 * - /r/:code - Direct affiliate code (e.g., /r/ABC123)
 * - /:username - Username-based link (e.g., /kodak)
 */
export default function AffiliateRedirect() {
  const { code, username } = useParams<{ code?: string; username?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setReferralCode } = useAffiliateTracking();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      const referralIdentifier = code || username;
      
      if (!referralIdentifier) {
        navigate('/');
        return;
      }

      let affiliateCode: string | null = null;

      try {
        let affiliateUsername: string | null = null;
        let affiliateId: string | null = null;
        
        if (code) {
          // Use secure RPC function to look up by affiliate code
          // This only returns id and username - no sensitive data exposed
          const { data: result, error } = await supabase
            .rpc('lookup_affiliate_by_code', { lookup_code: code.toUpperCase() });
          
          if (error) {
            console.warn('Error looking up affiliate code:', error.message);
          } else if (result && result.length > 0) {
            const affiliate = result[0];
            affiliateCode = code.toUpperCase();
            affiliateUsername = affiliate.username;
            affiliateId = affiliate.id;
          } else {
            console.warn('Invalid referral code');
          }
        } else if (username) {
          // Use secure RPC function to look up by username
          // This only returns id and affiliate_code - no sensitive data exposed
          const { data: result, error } = await supabase
            .rpc('lookup_affiliate_by_username', { lookup_username: username.toLowerCase() });
          
          if (error) {
            console.warn('Error looking up affiliate username:', error.message);
          } else if (result && result.length > 0) {
            const affiliate = result[0];
            affiliateCode = affiliate.affiliate_code;
            affiliateUsername = username.toLowerCase();
            affiliateId = affiliate.id;
          } else {
            console.warn('Invalid username');
          }
        }

        // Store the referral code for use during registration/purchase
        if (affiliateCode) {
          // Set the referral code in zustand store (persisted to localStorage)
          setReferralCode(affiliateCode);
          
          // Also store directly in localStorage as backup to ensure persistence
          try {
            const existingStorage = localStorage.getItem('affiliate-tracking');
            const parsed = existingStorage ? JSON.parse(existingStorage) : { state: {} };
            parsed.state.referralCode = affiliateCode;
            parsed.state.referralTimestamp = Date.now();
            localStorage.setItem('affiliate-tracking', JSON.stringify(parsed));
          } catch (storageError) {
            // Silent fail - storage errors should not affect user experience
          }

          // Show confirmation toast with affiliate username (not code for privacy)
          const displayName = affiliateUsername || 'a friend';
          toast.success(`Referred by ${displayName}`, {
            description: "Your referral has been recorded!",
            duration: 4000,
          });

          // Log the referral visit for audit purposes (fire and forget)
          logReferralVisit(affiliateCode, affiliateUsername, affiliateId);
        }
      } catch (error) {
        // Silent fail - errors should not block user navigation
        console.error('Error processing referral:', error);
      }

      setIsProcessing(false);
      
      // Small delay to ensure localStorage write completes before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Preserve any destination parameter and add referral code to URL as backup
      // Default destination: download page (not homepage, which looks like a "reload")
      const destination = searchParams.get('dest') || '/download';
      
      // If destination is auth page, append referral code to URL as backup
      if (affiliateCode && (destination.includes('/auth') || destination === '/download')) {
        const destUrl = new URL(destination, window.location.origin);
        destUrl.searchParams.set('ref', affiliateCode);
        navigate(destUrl.pathname + destUrl.search, { replace: true });
      } else {
        navigate(destination, { replace: true });
      }
    };

    handleRedirect();
  }, [code, username, navigate, setReferralCode, searchParams]);

  // Fire-and-forget logging function - no sensitive data logged to console
  const logReferralVisit = async (
    affiliateCode: string, 
    affiliateUsername: string | null, 
    affiliateId: string | null
  ) => {
    try {
      await supabase.functions.invoke('log-referral-visit', {
        body: {
          affiliateCode,
          affiliateUsername,
          affiliateId,
          referrerUrl: document.referrer || null,
          landingPage: window.location.pathname,
          // Don't send full userAgent - hash it server-side for fingerprinting protection
          userAgentHash: await hashString(navigator.userAgent),
        },
      });
    } catch {
      // Silent fail - logging should not affect user experience
    }
  };

  // Simple hash function for user agent fingerprint protection
  const hashString = async (str: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    } catch {
      return 'unknown';
    }
  };

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
