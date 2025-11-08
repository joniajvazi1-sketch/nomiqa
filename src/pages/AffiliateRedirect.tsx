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
        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser();

        // Track the click via edge function (works for everyone - logged in or anonymous)
        const { data, error } = await supabase.functions.invoke('track-affiliate-click', {
          body: {
            referralCode: code,
            username: username,
            userId: user?.id || user?.email,
            referrer: document.referrer
          }
        });

        if (!error && data?.affiliateCode) {
          // Set the referral code for future purchase tracking
          setReferralCode(data.affiliateCode);
          console.log('Affiliate click tracked:', data);
        } else if (error) {
          console.error('Error tracking affiliate click:', error);
        }
      } catch (error) {
        console.error('Error tracking affiliate click:', error);
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
