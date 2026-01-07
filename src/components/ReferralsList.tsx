import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  countryCode: string | null;
}

interface ReferralsListProps {
  affiliateId: string;
}

// Convert country code to flag emoji
const countryToFlag = (countryCode: string | null): string => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

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
      // Use edge function to securely fetch referral data
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
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-xl">
      <CardHeader className="pb-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-bold">
                My Referrals
              </span>
            </CardTitle>
            <CardDescription className="pl-11">
              People who signed up using your link
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 font-semibold">
            {referrals.length} {referrals.length === 1 ? 'referral' : 'referrals'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No referrals yet. Share your link to start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="p-4 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Country flag */}
                  <div className="text-2xl" title={referral.countryCode || 'Unknown'}>
                    {countryToFlag(referral.countryCode)}
                  </div>
                  <div className={`p-2 rounded-full ${referral.hasConverted ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                    {referral.hasConverted ? (
                      <ShoppingCart className="w-4 h-4 text-green-500" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm md:text-base">
                      {referral.username ? (
                        <span className="text-primary">@{referral.username}</span>
                      ) : (
                        <span className="text-muted-foreground italic">No username</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-11 sm:pl-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(referral.registeredAt)}
                  </div>
                  <Badge 
                    variant={referral.hasConverted ? "default" : "secondary"}
                    className={referral.hasConverted 
                      ? "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30" 
                      : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    }
                  >
                    {referral.hasConverted ? 'Purchased' : 'Registered'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
