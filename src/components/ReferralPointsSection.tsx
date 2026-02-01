import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Users, Zap, Rocket, Star, Crown, TrendingUp, Coins } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

interface ReferralPointsSectionProps {
  totalPoints: number;
  totalRegistrations: number;
  minerBoostPercentage: number;
  milestoneLevel: number;
}

const MILESTONES = [
  { level: 1, name: 'Recruiter', registrations: 5, boost: 10, icon: Users },
  { level: 2, name: 'Influencer', registrations: 15, boost: 20, icon: Zap },
  { level: 3, name: 'Ambassador', registrations: 30, boost: 40, icon: Star },
  { level: 4, name: 'Champion', registrations: 50, boost: 70, icon: Rocket },
  { level: 5, name: 'Legend', registrations: 100, boost: 100, icon: Crown },
];

export const ReferralPointsSection = ({
  totalPoints,
  totalRegistrations,
  minerBoostPercentage,
  milestoneLevel
}: ReferralPointsSectionProps) => {
  const { t } = useTranslation();
  
  const estimatedValue = (totalPoints * 0.01).toFixed(2);
  
  const getNextMilestone = () => {
    return MILESTONES.find(m => m.level > milestoneLevel);
  };

  const getCurrentMilestone = () => {
    return MILESTONES.find(m => m.level === milestoneLevel);
  };

  const nextMilestone = getNextMilestone();
  const currentMilestone = getCurrentMilestone();

  const getProgressToNext = () => {
    if (!nextMilestone) return 100;
    const prevThreshold = currentMilestone?.registrations || 0;
    const progress = ((totalRegistrations - prevThreshold) / (nextMilestone.registrations - prevThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const remainingToNext = nextMilestone ? nextMilestone.registrations - totalRegistrations : 0;

  return (
    <div className="space-y-6">
      {/* Points Overview Card */}
      <Card className="border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center border border-neon-cyan/20">
              <Coins className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">{t("referralPoints")}</CardTitle>
              <CardDescription className="text-muted-foreground">{t("referralPointsDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Points Display */}
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-violet/10 border border-white/10">
            <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-cyan bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              {totalPoints.toLocaleString()}
            </p>
            <p className="text-lg text-muted-foreground mt-2">{t("totalPoints")}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neon-violet/10 rounded-full border border-neon-violet/20">
              <TrendingUp className="w-4 h-4 text-neon-violet" />
              <span className="text-neon-violet font-medium">Convertible to $NOMIQA</span>
            </div>
          </div>

          {/* How You Earned */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
              <Users className="w-6 h-6 mx-auto text-neon-cyan mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalRegistrations}</p>
              <p className="text-xs text-muted-foreground">{t("referrals")}</p>
            </div>
            <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
              <Gift className="w-6 h-6 mx-auto text-neon-violet mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalRegistrations * 100}</p>
              <p className="text-xs text-muted-foreground">{t("referralBonus")}</p>
            </div>
          </div>

          {/* Crypto Conversion Notice */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{t("cryptoConversionTitle")}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("cryptoConversionMessage")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mining Boost Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/20">
                <Zap className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">{t("miningBoostLabel")}</CardTitle>
                <CardDescription>{t("miningBoostDescLabel")}</CardDescription>
              </div>
            </div>
            {minerBoostPercentage > 0 && (
            <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">
              +{minerBoostPercentage}% {t("active")}
            </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Progress to next milestone */}
          {nextMilestone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("progressTo")} {nextMilestone.name}</span>
                <span className="font-medium text-foreground">{remainingToNext} {t("moreNeeded")}</span>
              </div>
              <Progress value={getProgressToNext()} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalRegistrations} {t("referrals")}</span>
                <span>{nextMilestone.registrations} {t("required")}</span>
              </div>
            </div>
          )}

          {/* Milestone Tiers */}
          <div className="grid gap-2 mt-4">
            {MILESTONES.map((milestone) => {
              const isUnlocked = milestoneLevel >= milestone.level;
              const Icon = milestone.icon;
              return (
                <div
                  key={milestone.level}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isUnlocked
                      ? 'bg-neon-cyan/5 border-neon-cyan/20'
                      : 'bg-card/30 border-border/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isUnlocked ? 'bg-neon-cyan/20' : 'bg-muted/50'
                    }`}>
                      <Icon className={`w-4 h-4 ${isUnlocked ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {milestone.name}
                      </span>
                      <p className="text-xs text-muted-foreground">{milestone.registrations} {t("referrals")}</p>
                    </div>
                  </div>
                  <div className={`text-right ${isUnlocked ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
                    <div className="font-bold">+{milestone.boost}%</div>
                    <div className="text-xs opacity-70">{t("boost")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
