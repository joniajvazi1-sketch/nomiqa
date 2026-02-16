import { useState, useEffect, forwardRef } from 'react';
import { ExternalLink, Check, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import socialInstagram from '@/assets/social-instagram.webp';
import socialFacebook from '@/assets/social-facebook.webp';

const XLogo = forwardRef<SVGSVGElement>((_, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" className="w-7 h-7 fill-foreground" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
));

const TikTokLogo = forwardRef<SVGSVGElement>((_, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" className="w-7 h-7 fill-foreground" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
  </svg>
));

const POINTS_PER_FOLLOW = 50;

interface SocialTask {
  platform: string;
  label: string;
  icon?: string;
  svgComponent?: 'x' | 'tiktok';
  url: string;
}

const SOCIAL_TASKS: SocialTask[] = [
  {
    platform: 'x',
    label: 'X (Twitter)',
    svgComponent: 'x',
    url: 'https://x.com/nomiqadepin?s=21',
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    icon: socialInstagram,
    url: 'https://www.instagram.com/nomiqadepin',
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    icon: socialFacebook,
    url: 'https://www.facebook.com/profile.php?id=61584420749164',
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    svgComponent: 'tiktok',
    url: 'https://www.tiktok.com/@nomiqadepin',
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
            Extra Tasks to Earn Points
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete simple tasks and earn {POINTS_PER_FOLLOW} points each. One-time reward per task.
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
                  <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-muted/30">
                    {task.svgComponent === 'x' ? (
                      <XLogo />
                    ) : task.svgComponent === 'tiktok' ? (
                      <TikTokLogo />
                    ) : (
                      <img
                        src={task.icon}
                        alt={task.label}
                        className="w-14 h-14 object-cover"
                        loading="lazy"
                      />
                    )}
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
