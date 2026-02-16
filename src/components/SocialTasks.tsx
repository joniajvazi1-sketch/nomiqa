import { useState, useEffect } from 'react';
import { ExternalLink, Check, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import socialX from '@/assets/social-x-new.png';
import socialInstagram from '@/assets/social-instagram.png';
import socialFacebook from '@/assets/social-facebook.png';
import socialTiktok from '@/assets/social-tiktok.png';

const POINTS_PER_FOLLOW = 50;

interface SocialTask {
  platform: string;
  label: string;
  icon: string;
  url: string;
  color: string;
}

const SOCIAL_TASKS: SocialTask[] = [
  {
    platform: 'x',
    label: 'X (Twitter)',
    icon: socialX,
    url: 'https://x.com/nomiqadepin?s=21',
    color: 'from-zinc-800 to-zinc-900',
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    icon: socialInstagram,
    url: 'https://www.instagram.com/nomiqadepin',
    color: 'from-pink-600 to-purple-600',
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    icon: socialFacebook,
    url: 'https://www.facebook.com/profile.php?id=61584420749164',
    color: 'from-blue-600 to-blue-700',
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    icon: socialTiktok,
    url: 'https://www.tiktok.com/@nomiqadepin',
    color: 'from-zinc-900 to-zinc-800',
  },
];

export const SocialTasks = () => {
  const { toast } = useToast();
  const [claimedPlatforms, setClaimedPlatforms] = useState<Set<string>>(new Set());
  const [openedPlatforms, setOpenedPlatforms] = useState<Set<string>>(new Set());
  const [claiming, setClaiming] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClaims = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from('social_task_claims')
        .select('platform')
        .eq('user_id', user.id);

      if (data) {
        setClaimedPlatforms(new Set(data.map(d => d.platform)));
      }
      setLoading(false);
    };
    loadClaims();
  }, []);

  const COUNTDOWN_SECONDS = 20;

  const handleFollow = (task: SocialTask) => {
    window.open(task.url, '_blank', 'noopener,noreferrer');
    setOpenedPlatforms(prev => new Set(prev).add(task.platform));
    setCountdowns(prev => ({ ...prev, [task.platform]: COUNTDOWN_SECONDS }));
  };

  // Countdown timer effect
  useEffect(() => {
    const activeCountdowns = Object.entries(countdowns).filter(([, v]) => v > 0);
    if (activeCountdowns.length === 0) return;

    const interval = setInterval(() => {
      setCountdowns(prev => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key] > 0) next[key] -= 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdowns]);

  const handleClaim = async (task: SocialTask) => {
    if (!userId) {
      toast({ title: 'Please sign in to claim rewards', variant: 'destructive' });
      return;
    }
    if (claimedPlatforms.has(task.platform)) return;

    setClaiming(task.platform);
    try {
      // Insert claim (UNIQUE constraint prevents duplicates)
      const { error: claimError } = await supabase
        .from('social_task_claims')
        .insert({ user_id: userId, platform: task.platform, points_awarded: POINTS_PER_FOLLOW });

      if (claimError) {
        if (claimError.code === '23505') {
          // Already claimed
          setClaimedPlatforms(prev => new Set(prev).add(task.platform));
          toast({ title: 'Already claimed!' });
        } else {
          throw claimError;
        }
        return;
      }

      // Award points via RPC
      const { error: pointsError } = await supabase.rpc('add_referral_points', {
        p_user_id: userId,
        p_points: POINTS_PER_FOLLOW,
        p_source: `social_follow_${task.platform}`,
      });

      if (pointsError) {
        console.error('Points award error:', pointsError);
      }

      setClaimedPlatforms(prev => new Set(prev).add(task.platform));
      toast({
        title: `+${POINTS_PER_FOLLOW} pts earned!`,
        description: `Thanks for following us on ${task.label}`,
      });
    } catch (err) {
      console.error('Claim error:', err);
      toast({ title: 'Failed to claim reward', variant: 'destructive' });
    } finally {
      setClaiming(null);
    }
  };

  const totalEarned = claimedPlatforms.size * POINTS_PER_FOLLOW;
  const totalPossible = SOCIAL_TASKS.length * POINTS_PER_FOLLOW;

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-background to-card/20">
      <div className="container px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Gift className="w-4 h-4" />
            Earn {totalPossible} pts
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Follow Us & Earn Points
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Follow our social media accounts and earn {POINTS_PER_FOLLOW} points per follow. One-time reward per platform.
          </p>
          {totalEarned > 0 && (
            <p className="text-primary font-semibold mt-2">
              {totalEarned} / {totalPossible} pts earned
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {SOCIAL_TASKS.map((task) => {
            const isClaimed = claimedPlatforms.has(task.platform);
            const isOpened = openedPlatforms.has(task.platform);
            const isClaiming = claiming === task.platform;

            return (
              <Card
                key={task.platform}
                className={cn(
                  "border-border/50 transition-all overflow-hidden",
                  isClaimed && "opacity-70"
                )}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    task.color
                  )}>
                    <img
                      src={task.icon}
                      alt={task.label}
                      className="w-7 h-7 object-contain"
                      loading="lazy"
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-foreground text-sm">{task.label}</p>
                    <p className="text-xs text-muted-foreground">+{POINTS_PER_FOLLOW} pts</p>
                  </div>

                  {isClaimed ? (
                    <div className="flex items-center gap-1.5 text-green-500 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Claimed
                    </div>
                  ) : !userId && !loading ? (
                    <p className="text-xs text-muted-foreground">Sign in to earn</p>
                  ) : loading ? (
                    <div className="h-9 w-full bg-muted/20 rounded animate-pulse" />
                  ) : !isOpened ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => handleFollow(task)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Follow
                    </Button>
                  ) : (countdowns[task.platform] ?? 0) > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      disabled
                    >
                      Wait {countdowns[task.platform]}s...
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleClaim(task)}
                      disabled={isClaiming}
                    >
                      {isClaiming ? 'Claiming...' : 'Claim 50 pts'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SocialTasks;
