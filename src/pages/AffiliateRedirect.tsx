import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AffiliateRedirect() {
  const { code, username } = useParams<{ code?: string; username?: string }>();
  const navigate = useNavigate();
  const { setReferralCode } = useAffiliateTracking();

  useEffect(() => {
    const handleRedirect = async () => {
      const referralIdentifier = code || username;
      
      if (!referralIdentifier) {
        navigate('/');
        return;
      }

      try {
        // Look up the affiliate by code or username to get the affiliate_code
        let affiliateCode = code;
        
        if (username) {
          // If redirected via username, look up the affiliate_code
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('affiliate_code')
            .eq('username', username.toLowerCase())
            .maybeSingle();
          
          if (affiliate) {
            affiliateCode = affiliate.affiliate_code;
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

      // Redirect to home page
      navigate('/', { replace: true });
    };

    handleRedirect();
  }, [code, username, navigate, setReferralCode]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}