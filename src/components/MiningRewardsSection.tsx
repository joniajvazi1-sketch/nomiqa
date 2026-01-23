import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Unlock, Network, Users, Zap, Rocket, Crown, Star, Gift } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
interface MiningRewardsSectionProps {
  totalRegistrations: number;
  currentMilestoneLevel: number;
  minerBoostPercentage: number;
}
const MILESTONES = [{
  level: 1,
  nameKey: 'affiliateTierRecruiter',
  registrations: 5,
  boost: 10,
  icon: Users
}, {
  level: 2,
  nameKey: 'affiliateTierInfluencer',
  registrations: 15,
  boost: 20,
  icon: Zap
}, {
  level: 3,
  nameKey: 'affiliateTierAmbassador',
  registrations: 30,
  boost: 40,
  icon: Star
}, {
  level: 4,
  nameKey: 'affiliateTierChampion',
  registrations: 50,
  boost: 70,
  icon: Rocket
}, {
  level: 5,
  nameKey: 'affiliateTierLegend',
  registrations: 100,
  boost: 100,
  icon: Crown
}];
export const MiningRewardsSection = ({
  totalRegistrations,
  currentMilestoneLevel,
  minerBoostPercentage
}: MiningRewardsSectionProps) => {
  const {
    t
  } = useTranslation();
  const getNextMilestone = () => {
    return MILESTONES.find(m => m.level > currentMilestoneLevel);
  };
  const getCurrentMilestone = () => {
    return MILESTONES.find(m => m.level === currentMilestoneLevel);
  };
  const nextMilestone = getNextMilestone();
  const currentMilestone = getCurrentMilestone();
  const getProgressToNext = () => {
    if (!nextMilestone) return 100;
    const prevThreshold = currentMilestone?.registrations || 0;
    const progress = (totalRegistrations - prevThreshold) / (nextMilestone.registrations - prevThreshold) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  const remainingToNext = nextMilestone ? nextMilestone.registrations - totalRegistrations : 0;
  return <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
            <Network className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white">{t("miningRewardsTitle")}</h3>
            <p className="text-sm text-white/50">{t("miningRewardsDesc")}</p>
          </div>
        </div>
        
        {minerBoostPercentage > 0 && <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 rounded-full border border-neon-cyan/20">
            <Zap className="w-4 h-4 text-neon-cyan" />
            <span className="font-medium text-neon-cyan">+{minerBoostPercentage}% {t("miningBoostActive")}</span>
          </div>}
      </div>
      
      <div className="p-5 md:p-6 space-y-6">
        {/* Progress to next milestone */}
        {nextMilestone && <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">{t("progressTo")} {t(nextMilestone.nameKey)}</span>
              <span className="font-medium text-white px-[10px]">{remainingToNext} {t("moreRegistrationsNeeded")}</span>
            </div>
            <Progress value={getProgressToNext()} className="h-2 bg-white/10" />
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>{totalRegistrations} {t("registrationsCount")}</span>
              <span>{nextMilestone.registrations} {t("required")}</span>
            </div>
          </div>}
        
        {/* Milestones */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Gift className="w-4 h-4 text-neon-violet" />
            {t("minerBoostMilestones")}
          </h4>
          
          <div className="grid gap-2">
            {MILESTONES.map(milestone => {
            const isUnlocked = currentMilestoneLevel >= milestone.level;
            const Icon = milestone.icon;
            return <div key={milestone.level} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isUnlocked ? 'bg-neon-cyan/5 border-neon-cyan/20' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUnlocked ? 'bg-neon-cyan/20' : 'bg-white/5'}`}>
                      {isUnlocked ? <Icon className="w-4 h-4 text-neon-cyan" /> : <Lock className="w-4 h-4 text-white/30" />}
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                        {t(milestone.nameKey)}
                      </span>
                      <p className="text-xs text-white/40">{milestone.registrations} {t("registrationsCount")}</p>
                    </div>
                  </div>
                  
                  <div className={`text-right ${isUnlocked ? 'text-neon-cyan' : 'text-white/40'}`}>
                    <div className="font-bold">+{milestone.boost}%</div>
                    <div className="text-xs opacity-70">{t("miningBoost")}</div>
                  </div>
                </div>;
          })}
          </div>
        </div>
        
        {/* Referral Mining Bonus */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-violet/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-neon-violet" />
            </div>
            <div>
              <h4 className="font-medium text-white">{t("referralMiningBonus")}</h4>
              <p className="text-xs text-white/50">{t("passiveIncomeFromNetwork")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-emerald-400">5%</span>
            </div>
            <div>
              <p className="text-sm text-white">{t("earnFromReferralMining")}</p>
              <p className="text-xs text-white/40">{t("theyDontLoseAnything")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Users className="w-4 h-4" />
            <span><strong className="text-white">{totalRegistrations}</strong> {t("peopleInYourNetwork")}</span>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-neon-violet/10 rounded-lg border border-neon-violet/20">
            <Rocket className="w-4 h-4 text-neon-violet" />
            <p className="text-xs text-white/70">
              <strong className="text-neon-violet">{t("comingSoonMining")}</strong> {t("miningRewardsActivate")}
            </p>
          </div>
        </div>
      </div>
    </div>;
};