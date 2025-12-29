import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Unlock, TrendingUp, DollarSign, Users, ArrowRight, Award, Layers } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

interface ConversionRewardsSectionProps {
  totalConversions: number;
  currentTierLevel: number;
  totalEarnings: number;
}

const TIERS = [
  { level: 1, nameKey: 'starter', conversions: 0, commission: 9, descriptionKey: 'directReferrals', color: 'blue' },
  { level: 2, nameKey: 'pro', conversions: 10, commission: 6, descriptionKey: 'level2Bonus', color: 'purple' },
  { level: 3, nameKey: 'elite', conversions: 30, commission: 3, descriptionKey: 'level3Bonus', color: 'amber' },
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
  
  const getTotalCommission = () => {
    let total = 9; // Base commission
    if (currentTierLevel >= 2) total += 6;
    if (currentTierLevel >= 3) total += 3;
    return total;
  };

  const getColorClasses = (color: string, isUnlocked: boolean) => {
    if (!isUnlocked) return {
      bg: 'bg-muted/50',
      border: 'border-border/50',
      text: 'text-muted-foreground',
      icon: 'bg-muted/50',
      badge: 'bg-muted/50 text-muted-foreground border-border/50'
    };
    
    const colors: Record<string, any> = {
      blue: {
        bg: 'bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: 'bg-gradient-to-br from-blue-500/30 to-blue-600/30',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      },
      purple: {
        bg: 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        icon: 'bg-gradient-to-br from-purple-500/30 to-purple-600/30',
        badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      },
      amber: {
        bg: 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        icon: 'bg-gradient-to-br from-amber-500/30 to-amber-600/30',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card className="mb-8 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-amber-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="pb-4 border-b border-border/50 relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-amber-500/20 rounded-xl border border-purple-500/30">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
              {t('conversionRewards')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('unlockHigherCommissions')}
            </CardDescription>
          </div>
        </div>
        
        {/* Current commission display */}
        {currentTierLevel >= 2 && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-amber-500/20 rounded-full border border-purple-500/30">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-purple-400">{t('upToCommissionActive').replace('{percent}', String(getTotalCommission()))}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-6 relative space-y-8">
        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-sm">
              <span className="text-muted-foreground">{t('progressTo')} {TIER_NAMES[nextTier.nameKey]}</span>
              <span className="font-semibold text-foreground text-xs sm:text-sm">{remainingToNext} {t('moreConversionsNeeded')}</span>
            </div>
            <Progress value={getProgressToNext()} className="h-3 bg-muted/50" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{totalConversions} {t('conversionsCount')}</span>
              <span>{nextTier.conversions} {t('requiredLabel')}</span>
            </div>
          </div>
        )}
        
        {/* Tiers Grid */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            {t('commissionTierMilestones')}
          </h3>
          
          <div className="grid gap-3">
            {TIERS.map((tier) => {
              const isUnlocked = currentTierLevel >= tier.level;
              const isCurrent = currentTierLevel === tier.level;
              const colors = getColorClasses(tier.color, isUnlocked);
              
              return (
                <div
                  key={tier.level}
                  className={`relative p-3 sm:p-4 rounded-xl border transition-all duration-300 ${colors.bg} ${colors.border} ${
                    isUnlocked ? 'shadow-lg' : 'opacity-70'
                  } ${isCurrent ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-background' : ''}`}
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${colors.icon}`}>
                        {isUnlocked ? (
                          <Unlock className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text}`} />
                        ) : (
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className={`font-bold text-sm sm:text-base ${isUnlocked ? colors.text : 'text-muted-foreground'}`}>
                            {TIER_NAMES[tier.nameKey]}
                          </span>
                          {isUnlocked && (
                            <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 ${colors.badge}`}>
                              <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              {t('unlockedLabel')}
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className="text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 bg-purple-500 text-white">
                              {t('currentLabel')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {tier.conversions === 0 ? t('startHere') : `${tier.conversions} ${t('conversionsCount')}`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Commission */}
                    <div className={`text-right flex-shrink-0 ${isUnlocked ? colors.text : 'text-muted-foreground'}`}>
                      <div className="font-bold text-base sm:text-lg">{tier.level === 1 ? '' : '+'}{tier.commission}%</div>
                      <div className="text-[10px] sm:text-xs">{TIER_DESCRIPTIONS[tier.descriptionKey]}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Multi-Level Commission Explainer */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-xl border border-primary/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-primary/20 rounded-xl flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">{t('multiLevelCommissions')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('buildYourNetwork')}</p>
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {/* Level 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 flex-wrap">
                <span className="font-semibold text-blue-400">{t('levelLabel')} 1:</span>
                <span className="text-muted-foreground">{t('youLabel')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-foreground">{t('customerLabel')}</span>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs w-fit">
                <DollarSign className="w-3 h-3 mr-0.5" />
                9%
              </Badge>
            </div>
            
            {/* Level 2 */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border ${
              currentTierLevel >= 2 
                ? 'bg-purple-500/10 border-purple-500/20' 
                : 'bg-muted/20 border-border/50'
            }`}>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 flex-wrap">
                <span className={`font-semibold ${currentTierLevel >= 2 ? 'text-purple-400' : 'text-muted-foreground'}`}>
                  {t('levelLabel')} 2:
                </span>
                <span className="text-muted-foreground">{t('youLabel')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('referralLabel')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-foreground">{t('customerLabel')}</span>
              </div>
              <Badge variant="outline" className={`text-xs w-fit ${
                currentTierLevel >= 2 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-muted/50 text-muted-foreground border-border/50'
              }`}>
                {currentTierLevel >= 2 ? <DollarSign className="w-3 h-3 mr-0.5" /> : <Lock className="w-3 h-3 mr-0.5" />}
                +6%
              </Badge>
            </div>
            
            {/* Level 3 */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border ${
              currentTierLevel >= 3 
                ? 'bg-amber-500/10 border-amber-500/20' 
                : 'bg-muted/20 border-border/50'
            }`}>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 flex-wrap">
                <span className={`font-semibold ${currentTierLevel >= 3 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {t('levelLabel')} 3:
                </span>
                <span className="text-muted-foreground">{t('youLabel')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('refLabel')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('theirRefLabel')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-foreground">{t('customerLabel')}</span>
              </div>
              <Badge variant="outline" className={`text-xs w-fit ${
                currentTierLevel >= 3 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-muted/50 text-muted-foreground border-border/50'
              }`}>
                {currentTierLevel >= 3 ? <DollarSign className="w-3 h-3 mr-0.5" /> : <Lock className="w-3 h-3 mr-0.5" />}
                +3%
              </Badge>
            </div>
          </div>
          
          {/* Total earnings display */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-background/50 rounded-lg border border-border/50">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('totalLifetimeEarnings')}</span>
            <span className="text-base sm:text-lg font-bold text-primary">${totalEarnings.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
