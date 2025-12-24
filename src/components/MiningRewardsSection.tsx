import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Unlock, Pickaxe, Users, Zap, Rocket, Crown, Star, Gift } from "lucide-react";

interface MiningRewardsSectionProps {
  totalRegistrations: number;
  currentMilestoneLevel: number;
  minerBoostPercentage: number;
}

const MILESTONES = [
  { level: 1, name: 'Recruiter', registrations: 5, boost: 10, icon: Users },
  { level: 2, name: 'Influencer', registrations: 15, boost: 20, icon: Zap },
  { level: 3, name: 'Ambassador', registrations: 30, boost: 40, icon: Star },
  { level: 4, name: 'Champion', registrations: 50, boost: 70, icon: Rocket },
  { level: 5, name: 'Legend', registrations: 100, boost: 100, icon: Crown },
];

export const MiningRewardsSection = ({ 
  totalRegistrations, 
  currentMilestoneLevel,
  minerBoostPercentage 
}: MiningRewardsSectionProps) => {
  
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
    const progress = ((totalRegistrations - prevThreshold) / (nextMilestone.registrations - prevThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  const remainingToNext = nextMilestone ? nextMilestone.registrations - totalRegistrations : 0;

  return (
    <Card className="mb-8 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <CardHeader className="pb-4 border-b border-border/50 relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
            <Pickaxe className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Mining Rewards
            </CardTitle>
            <CardDescription className="text-sm">
              Unlock miner boosts by growing your network
            </CardDescription>
          </div>
        </div>
        
        {/* Current boost display */}
        {minerBoostPercentage > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-400">+{minerBoostPercentage}% Mining Boost Active</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-6 relative space-y-8">
        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextMilestone.name}</span>
              <span className="font-semibold text-foreground">{remainingToNext} more registrations needed</span>
            </div>
            <Progress value={getProgressToNext()} className="h-3 bg-muted/50" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{totalRegistrations} registrations</span>
              <span>{nextMilestone.registrations} required</span>
            </div>
          </div>
        )}
        
        {/* Milestones Grid */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Miner Boost Milestones
          </h3>
          
          <div className="grid gap-3">
            {MILESTONES.map((milestone) => {
              const isUnlocked = currentMilestoneLevel >= milestone.level;
              const isCurrent = currentMilestoneLevel === milestone.level;
              const Icon = milestone.icon;
              
              return (
                <div
                  key={milestone.level}
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-amber-500/30 shadow-lg'
                      : 'bg-muted/30 border-border/50 opacity-70'
                  } ${isCurrent ? 'ring-2 ring-amber-500/50 ring-offset-2 ring-offset-background' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl ${
                        isUnlocked 
                          ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30' 
                          : 'bg-muted/50'
                      }`}>
                        {isUnlocked ? (
                          <Icon className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {milestone.name}
                          </span>
                          {isUnlocked && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                              <Unlock className="w-3 h-3 mr-1" />
                              Unlocked
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className="text-xs bg-amber-500 text-black">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {milestone.registrations} registrations
                        </p>
                      </div>
                    </div>
                    
                    {/* Reward */}
                    <div className={`text-right ${isUnlocked ? 'text-amber-400' : 'text-muted-foreground'}`}>
                      <div className="font-bold text-lg">+{milestone.boost}%</div>
                      <div className="text-xs">Mining Boost</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Referral Mining Bonus Card */}
        <div className="p-5 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-xl border border-primary/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-xl">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Referral Mining Bonus</h3>
              <p className="text-sm text-muted-foreground">Passive income from your network</p>
            </div>
          </div>
          
          <div className="p-4 bg-background/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-green-400">5%</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Earn 5% of what your referrals mine</p>
                <p className="text-xs text-muted-foreground">They don't lose anything — it's a bonus for you!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span><strong className="text-foreground">{totalRegistrations}</strong> people in your network</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Rocket className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-amber-200/80">
              <strong className="text-amber-400">Coming Soon:</strong> Mining rewards will activate when the network launches!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
