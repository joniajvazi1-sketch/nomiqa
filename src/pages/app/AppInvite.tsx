import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Gift, Copy, Share2, Check, 
  Award, Sparkles, MessageCircle, Mail, Link2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNativeShare } from '@/hooks/useNativeShare';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TOKENOMICS } from '@/utils/tokenomics';
import { AppSpinner } from '@/components/app/AppSpinner';
import { TeamActivityCard } from '@/components/app/TeamActivityCard';

interface AffiliateData {
  id: string;
  affiliate_code: string;
  username: string | null;
  total_registrations: number;
  total_conversions: number;
  total_earnings_usd: number;
  miner_boost_percentage: number;
  registration_milestone_level: number;
}

// Milestone tiers for reward boost
const MILESTONE_TIERS = [
  { level: 0, name: 'Starter', contributors: 0, boost: 0 },
  { level: 1, name: 'Advocate', contributors: 5, boost: 10 },
  { level: 2, name: 'Ambassador', contributors: 15, boost: 25 },
  { level: 3, name: 'Champion', contributors: 30, boost: 50 },
  { level: 4, name: 'Elite', contributors: 50, boost: 75 },
  { level: 5, name: 'Legend', contributors: 100, boost: 100 },
];

export const AppInvite: React.FC = () => {
  const { share, copyToClipboard } = useNativeShare();
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { playSuccess } = useEnhancedSounds();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Using _safe view to exclude sensitive verification fields
        const { data } = await supabase
          .from('affiliates_safe')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('tier_level', { ascending: false })
          .limit(1)
          .maybeSingle();

        setAffiliate(data);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = affiliate?.username || affiliate?.affiliate_code || '';

  const handleCopyCode = async () => {
    if (!referralCode) return;
    buttonTap();
    const success = await copyToClipboard(referralCode);
    if (success) {
      setCopied(true);
      successPattern();
      playSuccess();
      toast({ title: 'Referral code copied!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    buttonTap();
    await share({
      title: 'Join Nomiqa',
      text: `Join Nomiqa and contribute to better mobile connectivity! Use my referral code: ${referralCode} to sign up and we both get ${TOKENOMICS.REFERRAL_BONUS_POINTS} bonus points.`,
      url: 'https://nomiqa-depin.com/download',
      dialogTitle: 'Invite Contributors'
    });
  };

  const handleShareVia = async (platform: 'whatsapp' | 'telegram' | 'sms' | 'email') => {
    buttonTap();
    const message = `Join Nomiqa and contribute to better mobile connectivity! Use my referral code: ${referralCode} when you sign up. Download: https://nomiqa-depin.com/download`;
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent('https://nomiqa-depin.com/download')}&text=${encodeURIComponent(`Join me on Nomiqa! Use code: ${referralCode}`)}`,
      sms: `sms:?body=${encodeURIComponent(message)}`,
      email: `mailto:?subject=${encodeURIComponent('Join Nomiqa')}&body=${encodeURIComponent(message)}`
    };

    window.open(urls[platform], '_blank');
  };

  // Calculate current tier and progress
  const currentTier = MILESTONE_TIERS.find(t => t.level === (affiliate?.registration_milestone_level || 0)) || MILESTONE_TIERS[0];
  const nextTier = MILESTONE_TIERS.find(t => t.level === (affiliate?.registration_milestone_level || 0) + 1);
  const contributorsToNext = nextTier ? nextTier.contributors - (affiliate?.total_registrations || 0) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to Invite</h2>
        <p className="text-muted-foreground text-sm">
          Create an account to get your personal referral link
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">Invite Contributors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share in the value your network helps create
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Reward Structure Card - Premium Styling */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-premium overflow-hidden">
            <CardContent className="p-4 relative">
              {/* Subtle shimmer effect */}
              <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Referral Rewards</h3>
                    <p className="text-xs text-muted-foreground">Both you and your friend earn</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-premium rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary">
                      {TOKENOMICS.REFERRAL_BONUS_POINTS}
                    </div>
                    <div className="text-xs text-muted-foreground">pts when they join</div>
                  </div>
                  <div className="card-premium rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary">
                      {(TOKENOMICS.REFERRAL_COMMISSION_RATE * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">value share</div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Share in the value from your network's contributions
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Link Section - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Your Referral Code</span>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  @{affiliate?.username || 'your-code'}
                </Badge>
              </div>
              
              {/* Code display */}
              <motion.div 
                whileTap={{ scale: 0.98 }}
                className="bg-muted/50 rounded-xl p-4 flex items-center justify-center mb-4 cursor-pointer border border-border/50"
                onClick={handleCopyCode}
              >
                <span className="text-2xl font-bold text-primary font-mono tracking-wider">
                  {referralCode || 'Loading...'}
                </span>
              </motion.div>

              <p className="text-xs text-muted-foreground text-center mb-4">
                Friends enter this code when they sign up
              </p>

              {/* Copy button */}
              <Button 
                className="w-full h-12 text-base font-medium gap-2 mb-2"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Referral Code
                  </>
                )}
              </Button>

              {/* Main share button */}
              <Button 
                className="w-full h-12 text-base font-medium gap-2 pulse-glow"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
                Share with Friends
              </Button>

              {/* Quick share buttons - Enhanced */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShareVia('whatsapp')}
                  className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center hover:bg-[#25D366]/25 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShareVia('telegram')}
                  className="w-12 h-12 rounded-full bg-[#0088cc]/15 flex items-center justify-center hover:bg-[#0088cc]/25 transition-colors"
                >
                  <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShareVia('sms')}
                  className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-foreground" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShareVia('email')}
                  className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Mail className="w-5 h-5 text-foreground" />
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Team Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TeamActivityCard userId={user?.id || null} />
        </motion.div>

        {/* Reward Boost Tier */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-reward" />
                  <h3 className="font-semibold text-foreground">Network Tier</h3>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    currentTier.boost > 0 && "border-reward text-reward"
                  )}
                >
                  {currentTier.name}
                </Badge>
              </div>

              {/* Current boost */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Contribution Boost</div>
                  <div className="text-xl font-bold text-reward">
                    +{affiliate?.miner_boost_percentage || currentTier.boost}%
                  </div>
                </div>
                <Sparkles className="w-8 h-8 text-reward/50" />
              </div>

              {/* Progress to next tier */}
              {nextTier && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                    <span className="text-foreground font-medium">
                      {affiliate?.total_registrations || 0} / {nextTier.contributors}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min(((affiliate?.total_registrations || 0) / nextTier.contributors) * 100, 100)}%` 
                      }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {contributorsToNext} more contributors for +{nextTier.boost}% boost
                  </p>
                </div>
              )}

              {/* All tiers */}
              <div className="mt-4 space-y-2">
                {MILESTONE_TIERS.slice(1).map((tier) => {
                  const isAchieved = (affiliate?.registration_milestone_level || 0) >= tier.level;
                  const isCurrent = (affiliate?.registration_milestone_level || 0) === tier.level;
                  
                  return (
                    <div 
                      key={tier.level}
                      className={cn(
                        "flex items-center justify-between py-2 px-3 rounded-lg",
                        isCurrent && "bg-primary/10 border border-primary/30",
                        isAchieved && !isCurrent && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isAchieved ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className={cn(
                          "text-sm",
                          isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                        )}>
                          {tier.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({tier.contributors} contributors)
                        </span>
                      </div>
                      <Badge 
                        variant={isCurrent ? "default" : "outline"}
                        className="text-xs"
                      >
                        +{tier.boost}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Tips to Grow</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Share with travel groups and digital nomad communities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Post about your earnings on social media
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Help friends understand the value of network contribution
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AppInvite;
