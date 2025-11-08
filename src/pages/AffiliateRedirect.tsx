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
        // Try to find affiliate by username first, then by code
        let affiliate;
        
        if (username) {
          const { data } = await supabase
            .from('affiliates')
            .select('id, affiliate_code, total_clicks')
            .eq('username', username.toLowerCase())
            .single();
          affiliate = data;
        } else {
          const { data } = await supabase
            .from('affiliates')
            .select('id, affiliate_code, total_clicks')
            .eq('affiliate_code', code)
            .single();
          affiliate = data;
        }

        if (affiliate) {
          // Set the referral code
          setReferralCode(affiliate.affiliate_code);

          // Update click count
          await supabase
            .from('affiliates')
            .update({ total_clicks: (affiliate.total_clicks || 0) + 1 })
            .eq('id', affiliate.id);

          // Record the referral click
          await supabase
            .from('affiliate_referrals')
            .insert({
              affiliate_id: affiliate.id,
              visitor_id: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              clicked_at: new Date().toISOString()
            });
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
