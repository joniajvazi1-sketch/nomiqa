import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

      try {
        // Look up the affiliate by code or username to get the affiliate_code and username
        let affiliateCode: string | null = null;
        let affiliateUsername: string | null = null;
        let affiliateId: string | null = null;
        
        if (code) {
          // Verify the code exists in the database
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, affiliate_code, username')
            .eq('affiliate_code', code.toUpperCase())
            .maybeSingle();
          
          if (affiliate) {
            affiliateCode = affiliate.affiliate_code;
            affiliateUsername = affiliate.username;
            affiliateId = affiliate.id;
          } else {
            console.warn('Invalid referral code:', code);
          }
        } else if (username) {
          // If redirected via username, look up the affiliate_code
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, affiliate_code, username')
            .eq('username', username.toLowerCase())
            .maybeSingle();
          
          if (affiliate) {
            affiliateCode = affiliate.affiliate_code;
            affiliateUsername = affiliate.username;
            affiliateId = affiliate.id;
          } else {
            console.warn('Invalid username:', username);
          }
        }

        // Store the referral code for use during registration/purchase
        if (affiliateCode) {
          // Set the referral code in zustand store (persisted to localStorage)
          setReferralCode(affiliateCode);
          console.log('Referral code stored:', affiliateCode);
          
          // Also store directly in localStorage as backup to ensure persistence
          // This prevents race conditions with zustand's async persist
          try {
            const existingStorage = localStorage.getItem('affiliate-tracking');
            const parsed = existingStorage ? JSON.parse(existingStorage) : { state: {} };
            parsed.state.referralCode = affiliateCode;
            parsed.state.referralTimestamp = Date.now();
            localStorage.setItem('affiliate-tracking', JSON.stringify(parsed));
            console.log('Referral code also saved directly to localStorage');
          } catch (storageError) {
            console.error('Error saving to localStorage:', storageError);
          }

          // Show confirmation toast with affiliate username
          const displayName = affiliateUsername || code || username;
          toast.success(`Referred by ${displayName}`, {
            description: "Your referral has been recorded!",
            duration: 4000,
          });

          // Log the referral visit for audit purposes (fire and forget)
          logReferralVisit(affiliateCode, affiliateUsername, affiliateId);
        }
      } catch (error) {
        console.error('Error looking up affiliate:', error);
      }

      setIsProcessing(false);
      
      // Small delay to ensure localStorage write completes before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Preserve any destination parameter
      const destination = searchParams.get('dest') || '/';
      navigate(destination, { replace: true });
    };

    handleRedirect();
  }, [code, username, navigate, setReferralCode, searchParams]);

  // Fire-and-forget logging function
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
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      // Silent fail - logging should not affect user experience
      console.error('Failed to log referral visit:', error);
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
