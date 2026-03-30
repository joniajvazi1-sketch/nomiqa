import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle2, Circle, Clock, Flame, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AppSpinner } from '@/components/app/AppSpinner';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';
import { AppSEO } from '@/components/app/AppSEO';
import { getAppVersion } from '@/lib/sentry';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  target_value: number;
  reward_points: number;
  metric_type: string;
}

interface ChallengeProgress {
  challenge_id: string;
  current_value: number;
  completed_at: string | null;
  claimed_at: string | null;
}

export const AppChallenges: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap, mediumTap } = useHaptics();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, ChallengeProgress>>({});
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      // Use Monday as ISO week start (not Sunday)
      const weekStart = new Date();
      const dayOfWeek = (weekStart.getDay() + 6) % 7; // Mon=0, Sun=6
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const [challengesRes, progressRes] = await Promise.all([
        supabase.from('challenges').select('*').eq('is_active', true).order('type'),
        supabase.from('user_challenge_progress')
          .select('challenge_id, current_value, completed_at, claimed_at, period_start')
          .eq('user_id', user.id)
          .gte('period_start', weekStartStr),
      ]);

      if (challengesRes.data) {
        setChallenges(challengesRes.data as Challenge[]);
      }

      // Build a set of daily vs weekly challenge IDs for filtering
      const challengeTypeMap: Record<string, string> = {};
      (challengesRes.data || []).forEach((c: any) => { challengeTypeMap[c.id] = c.type; });

      const progressMap: Record<string, ChallengeProgress> = {};
      (progressRes.data || []).forEach((p: any) => {
        const type = challengeTypeMap[p.challenge_id];
        // Daily: only use rows where period_start === today
        if (type === 'daily' && p.period_start !== today) return;
        // Weekly: only use rows where period_start >= weekStartStr (already filtered by query)
        progressMap[p.challenge_id] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (challenge: Challenge) => {
    if (claiming) return;
    const prog = progress[challenge.id];
    if (!prog?.completed_at || prog.claimed_at) return;

    setClaiming(challenge.id);
    mediumTap();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('claim_challenge_reward', {
        p_user_id: user.id,
        p_challenge_id: challenge.id,
        p_reward_points: challenge.reward_points,
        p_bonus_points: 0,
        p_period_start: today,
        p_is_daily: challenge.type === 'daily',
        p_app_version: getAppVersion(),
      } as any);

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast.success(`+${result.points_added} pts claimed! 🎉`);
        window.dispatchEvent(new CustomEvent('points-updated', { detail: { newTotal: result.new_total } }));
        loadChallenges();
      } else {
        toast.error(result?.reason === 'already_claimed' ? 'Already claimed!' : 'Could not claim');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  };

  const filtered = challenges.filter(c => c.type === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <AppSEO />
      <div className="min-h-screen pb-24">
        <div className="px-4 py-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => { lightTap(); navigate(-1); }} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Challenges</h1>
              <p className="text-xs text-muted-foreground">Complete tasks to earn bonus points</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { lightTap(); setActiveTab('daily'); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'daily'
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Flame className="w-4 h-4 inline mr-1.5" />
              Daily
            </button>
            <button
              onClick={() => { lightTap(); setActiveTab('weekly'); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'weekly'
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Target className="w-4 h-4 inline mr-1.5" />
              Weekly
            </button>
          </div>

          {/* Challenge Cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-card border border-dashed border-border p-8 text-center">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No {activeTab} challenges available</p>
              </div>
            ) : (
              filtered.map((challenge, i) => {
                const prog = progress[challenge.id];
                const isCompleted = !!prog?.completed_at;
                const isClaimed = !!prog?.claimed_at;
                const currentVal = prog?.current_value || 0;
                const progressPct = Math.min(100, (currentVal / challenge.target_value) * 100);

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "rounded-2xl border p-4 space-y-3 transition-colors",
                      isClaimed
                        ? "bg-muted/30 border-border/50"
                        : isCompleted
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {isClaimed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        ) : isCompleted ? (
                          <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={cn("text-sm font-semibold", isClaimed ? "text-muted-foreground line-through" : "text-foreground")}>
                            {challenge.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                        </div>
                      </div>
                      <span className={cn("text-xs font-bold shrink-0 ml-2", isClaimed ? "text-muted-foreground" : "text-primary")}>
                        +{challenge.reward_points} pts
                      </span>
                    </div>

                    {/* Progress bar */}
                    {!isClaimed && (
                      <div className="space-y-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", isCompleted ? "bg-primary" : "bg-primary/60")}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{Math.floor(currentVal)} / {challenge.target_value}</span>
                          <span>{Math.floor(progressPct)}%</span>
                        </div>
                      </div>
                    )}

                    {/* Claim button */}
                    {isCompleted && !isClaimed && (
                      <button
                        onClick={() => handleClaim(challenge)}
                        disabled={claiming === challenge.id}
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                      >
                        {claiming === challenge.id ? 'Claiming...' : `Claim ${challenge.reward_points} pts`}
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AppChallenges;
