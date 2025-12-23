import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AffiliateRedirect() {
  const { code, username } = useParams<{ code?: string; username?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setReferralCode, clearReferralCode } = useAffiliateTracking();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      const referralIdentifier = code || username;
      
      if (!referralIdentifier) {
        navigate('/');
        return;
      }

      try {
        // Clear any existing referral code first to ensure we use the new one
        clearReferralCode();
        
        // Look up the affiliate by code or username to get the affiliate_code
        let affiliateCode: string | null = null;
        
        if (code) {
          // Verify the code exists in the database
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('affiliate_code')
            .eq('affiliate_code', code.toUpperCase())
            .maybeSingle();
          
          if (affiliate) {
            affiliateCode = affiliate.affiliate_code;
          } else {
            console.warn('Invalid referral code:', code);
          }
        } else if (username) {
          // If redirected via username, look up the affiliate_code
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('affiliate_code')
            .eq('username', username.toLowerCase())
            .maybeSingle();
          
          if (affiliate) {
            affiliateCode = affiliate.affiliate_code;
          } else {
            console.warn('Invalid username:', username);
          }
        }

        // Store the referral code for use during registration/purchase
        if (affiliateCode) {
          setReferralCode(affiliateCode);
          console.log('Referral code stored:', affiliateCode);
        }
      } catch (error) {
        console.error('Error looking up affiliate:', error);
      }

      setIsProcessing(false);
      
      // Preserve any destination parameter
      const destination = searchParams.get('dest') || '/';
      navigate(destination, { replace: true });
    };

    handleRedirect();
  }, [code, username, navigate, setReferralCode, clearReferralCode, searchParams]);

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