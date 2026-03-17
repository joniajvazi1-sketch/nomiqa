import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

interface ConversionRewardsSectionProps {
  totalConversions: number;
  currentTierLevel: number;
  totalEarnings: number;
}

export const ConversionRewardsSection = ({ 
  totalConversions, 
  currentTierLevel,
  totalEarnings 
}: ConversionRewardsSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-violet/20 to-neon-violet/10 flex items-center justify-center border border-neon-violet/20">
            <TrendingUp className="w-5 h-5 text-neon-violet" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white">{t('conversionRewards')}</h3>
            <p className="text-sm text-white/50">{t('referralCommissionFlat')}</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 md:p-6 space-y-6">
        {/* Flat 10% Commission Card */}
        <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <span className="text-sm font-medium text-white">{t('directReferrals')}</span>
                <p className="text-xs text-white/40">{t('flatCommissionDesc')}</p>
              </div>
            </div>
            <Badge className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 text-lg px-3 py-1">10%</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
            <p className="text-2xl font-bold text-white">{totalConversions}</p>
            <p className="text-xs text-white/50">{t('conversionsCount')}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
            <p className="text-2xl font-bold text-primary">${totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-white/50">{t('totalLifetimeEarnings')}</p>
          </div>
        </div>

        {/* Points commission */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-white">{t('referralMiningBonus')}</h4>
              <p className="text-xs text-white/50">{t('earnFromReferralMining')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
