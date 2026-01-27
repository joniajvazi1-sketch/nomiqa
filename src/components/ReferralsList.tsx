import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, Loader2, UserCheck, ShoppingCart, Clock } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

interface ReferredUser {
  id: string;
  username: string | null;
  registeredAt: string;
  status: string;
  hasConverted: boolean;
}

interface ReferralsListProps {
  affiliateId: string;
}

export function ReferralsList({ affiliateId }: ReferralsListProps) {
  const { t } = useTranslation();
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (affiliateId) {
      fetchReferrals();
    }
  }, [affiliateId]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-affiliate-referrals', {
        body: { affiliate_id: affiliateId }
      });

      if (error) throw error;

      setReferrals(data?.referrals || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Users className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-light text-white truncate">{t("affiliateMyReferrals")}</h3>
            <p className="text-sm text-white/50 truncate">{t("affiliateMyReferralsDesc")}</p>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0 w-fit">
          {referrals.length} {referrals.length === 1 ? t("affiliateReferralSingular") : t("affiliateReferralPlural")}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-white/20" strokeWidth={2.5} />
            <p className="text-sm text-white/50">{t("affiliateNoReferrals")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${referral.hasConverted ? 'bg-emerald-500/20' : 'bg-neon-cyan/20'}`}>
                    {referral.hasConverted ? (
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-neon-cyan" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {referral.username ? (
                        <span className="text-white">@{referral.username}</span>
                      ) : (
                        <span className="text-white/40 italic">No username</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-11 sm:pl-0">
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(referral.registeredAt)}
                  </div>
                  <Badge 
                    className={referral.hasConverted 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20"
                    }
                  >
                    {referral.hasConverted ? t("affiliateStatusPurchased") : t("affiliateStatusRegistered")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
