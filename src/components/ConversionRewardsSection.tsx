import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Unlock, TrendingUp, DollarSign, Users, ArrowRight, Layers } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

interface ConversionRewardsSectionProps {
  totalConversions: number;
  currentTierLevel: number;
  totalEarnings: number;
}

const TIERS = [
  { level: 1, nameKey: 'starter', conversions: 0, commission: 9, descriptionKey: 'directReferrals', color: 'cyan' },
  { level: 2, nameKey: 'pro', conversions: 10, commission: 6, descriptionKey: 'level2Bonus', color: 'violet' },
  { level: 3, nameKey: 'elite', conversions: 30, commission: 3, descriptionKey: 'level3Bonus', color: 'coral' },
];

export const ConversionRewardsSection = ({ 
  totalConversions, 
  currentTierLevel,
  totalEarnings 
}: ConversionRewardsSectionProps) => {
  const { t } = useTranslation();
  
  const TIER_NAMES: Record<string, string> = {
    'starter': t('starter'),
    'pro': t('pro'),
    'elite': t('elite'),
  };
  
  const TIER_DESCRIPTIONS: Record<string, string> = {
    'directReferrals': t('directReferrals'),
    'level2Bonus': t('level2Bonus'),
    'level3Bonus': t('level3Bonus'),
  };
  
  const getNextTier = () => {
    return TIERS.find(tier => tier.level > currentTierLevel);
  };
  
  const getCurrentTier = () => {
    return TIERS.find(tier => tier.level === currentTierLevel) || TIERS[0];
  };
  
  const nextTier = getNextTier();
  const currentTier = getCurrentTier();
  
  const getProgressToNext = () => {
    if (!nextTier) return 100;
    const prevThreshold = currentTier?.conversions || 0;
    const progress = ((totalConversions - prevThreshold) / (nextTier.conversions - prevThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  const remainingToNext = nextTier ? nextTier.conversions - totalConversions : 0;

  const getColorClasses = (color: string, isUnlocked: boolean) => {
    if (!isUnlocked) return { text: 'text-white/40', bg: 'bg-white/5' };
    const colors: Record<string, { text: string; bg: string }> = {
      cyan: { text: 'text-neon-cyan', bg: 'bg-neon-cyan/20' },
      violet: { text: 'text-neon-violet', bg: 'bg-neon-violet/20' },
      coral: { text: 'text-neon-coral', bg: 'bg-neon-coral/20' },
    };
    return colors[color] || colors.cyan;
  };

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
            <p className="text-sm text-white/50">{t('unlockHigherCommissions')}</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 md:p-6 space-y-6">
        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">{t('progressTo')} {TIER_NAMES[nextTier.nameKey]}</span>
              <span className="font-medium text-white">{remainingToNext} {t('moreConversionsNeeded')}</span>
            </div>
            <Progress value={getProgressToNext()} className="h-2 bg-white/10" />
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>{totalConversions} {t('conversionsCount')}</span>
              <span>{nextTier.conversions} {t('requiredLabel')}</span>
            </div>
          </div>
        )}
        
        {/* Tiers */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Layers className="w-4 h-4 text-neon-coral" />
            {t('commissionTierMilestones')}
          </h4>
          
          <div className="grid gap-2">
            {TIERS.map((tier) => {
              const isUnlocked = currentTierLevel >= tier.level;
              const colors = getColorClasses(tier.color, isUnlocked);
              
              return (
                <div
                  key={tier.level}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isUnlocked
                      ? `bg-${tier.color === 'cyan' ? 'neon-cyan' : tier.color === 'violet' ? 'neon-violet' : 'neon-coral'}/5 border-${tier.color === 'cyan' ? 'neon-cyan' : tier.color === 'violet' ? 'neon-violet' : 'neon-coral'}/20`
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                  style={{
                    backgroundColor: isUnlocked 
                      ? tier.color === 'cyan' ? 'rgba(0, 255, 200, 0.05)' 
                      : tier.color === 'violet' ? 'rgba(139, 92, 246, 0.05)' 
                      : 'rgba(255, 107, 107, 0.05)'
                      : undefined,
                    borderColor: isUnlocked 
                      ? tier.color === 'cyan' ? 'rgba(0, 255, 200, 0.2)' 
                      : tier.color === 'violet' ? 'rgba(139, 92, 246, 0.2)' 
                      : 'rgba(255, 107, 107, 0.2)'
                      : undefined
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                      {isUnlocked ? (
                        <Unlock className={`w-4 h-4 ${colors.text}`} />
                      ) : (
                        <Lock className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                        {TIER_NAMES[tier.nameKey]}
                      </span>
                      <p className="text-xs text-white/40">
                        {tier.conversions === 0 ? t('startHere') : `${tier.conversions} ${t('conversionsCount')}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`text-right ${colors.text}`}>
                    <div className="font-bold">{tier.level === 1 ? '' : '+'}{tier.commission}%</div>
                    <div className="text-xs opacity-70">{TIER_DESCRIPTIONS[tier.descriptionKey]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Multi-Level Commission Explainer */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-white">{t('multiLevelCommissions')}</h4>
              <p className="text-xs text-white/50">{t('buildYourNetwork')}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Level 1 */}
            <div className="flex items-center justify-between p-3 bg-neon-cyan/5 rounded-lg border border-neon-cyan/20">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-neon-cyan">{t('levelLabel')} 1:</span>
                <span className="text-white/50">{t('youLabel')}</span>
                <ArrowRight className="w-3 h-3 text-white/30" />
                <span className="text-white">{t('customerLabel')}</span>
              </div>
              <Badge className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 text-xs">9%</Badge>
            </div>
            
            {/* Level 2 */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              currentTierLevel >= 2 
                ? 'bg-neon-violet/5 border-neon-violet/20' 
                : 'bg-white/[0.02] border-white/5'
            }`}>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className={`font-medium ${currentTierLevel >= 2 ? 'text-neon-violet' : 'text-white/40'}`}>
                  {t('levelLabel')} 2:
                </span>
                <span className="text-white/50">{t('youLabel')}</span>
                <ArrowRight className="w-3 h-3 text-white/30" />
                <span className="text-white/50">{t('referralLabel')}</span>
                <ArrowRight className="w-3 h-3 text-white/30" />
                <span className="text-white">{t('customerLabel')}</span>
              </div>
              <Badge className={`text-xs ${
                currentTierLevel >= 2 
                  ? 'bg-neon-violet/10 text-neon-violet border-neon-violet/20'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}>
                {currentTierLevel >= 2 ? '+6%' : <Lock className="w-3 h-3" />}
              </Badge>
            </div>
            
            {/* Level 3 */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              currentTierLevel >= 3 
                ? 'bg-neon-coral/5 border-neon-coral/20' 
                : 'bg-white/[0.02] border-white/5'
            }`}>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className={`font-medium ${currentTierLevel >= 3 ? 'text-neon-coral' : 'text-white/40'}`}>
                  {t('levelLabel')} 3:
                </span>
                <span className="text-white/50">{t('youLabel')}</span>
                <ArrowRight className="w-3 h-3 text-white/30" />
                <span className="text-white/50">{t('refLabel')}</span>
                <ArrowRight className="w-3 h-3 text-white/30" />
                <span className="text-white/50">{t('theirRefLabel')}</span>
                <ArrowRight className="w-3 h-3 text-white/30" />
                <span className="text-white">{t('customerLabel')}</span>
              </div>
              <Badge className={`text-xs ${
                currentTierLevel >= 3 
                  ? 'bg-neon-coral/10 text-neon-coral border-neon-coral/20'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}>
                {currentTierLevel >= 3 ? '+3%' : <Lock className="w-3 h-3" />}
              </Badge>
            </div>
          </div>
          
          {/* Total earnings */}
          <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/10">
            <span className="text-sm text-white/60">{t('totalLifetimeEarnings')}</span>
            <span className="text-lg font-bold text-primary">${totalEarnings.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
