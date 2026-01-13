import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, MapPin, Flame, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useHaptics } from '@/hooks/useHaptics';
import { pointsToUsd } from '@/utils/tokenomics';
import { APP_COPY } from '@/utils/appCopy';
import { cn } from '@/lib/utils';

interface WeeklySummaryData {
  pointsEarned: number;
  areasExplored: number;
  streakDays: number;
  isTopContributor: boolean;
  weeklyRank?: number;
}

export const WeeklySummaryModal: React.FC = () => {
  const { success, mediumTap } = useHaptics();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<WeeklySummaryData | null>(null);

  useEffect(() => {
    checkAndShowSummary();
  }, []);

  const checkAndShowSummary = async () => {
    try {
      // Check if it's Sunday or Monday and we haven't shown the summary this week
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Show on Sunday (0) or Monday (1)
      if (dayOfWeek !== 0 && dayOfWeek !== 1) return;

      // Check localStorage for last shown date
      const lastShown = localStorage.getItem('weeklySummaryLastShown');
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);

      if (lastShown && new Date(lastShown) >= thisWeekStart) {
        return; // Already shown this week
      }

      // Fetch weekly data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get sessions from past week
      const { data: sessions } = await supabase
        .from('contribution_sessions')
        .select('total_points_earned, total_distance_meters, started_at')
        .eq('user_id', user.id)
        .gte('started_at', weekAgo.toISOString());

      if (!sessions || sessions.length === 0) return;

      const pointsEarned = sessions.reduce((sum, s) => sum + (s.total_points_earned || 0), 0);
      const totalDistance = sessions.reduce((sum, s) => sum + (s.total_distance_meters || 0), 0);
      const areasExplored = Math.floor(totalDistance / 5000); // Rough estimate

      // Get streak
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('contribution_streak_days')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get rank
      const { data: rankData } = await supabase
        .from('leaderboard_cache')
        .select('rank_weekly')
        .eq('user_id', user.id)
        .maybeSingle();

      setData({
        pointsEarned,
        areasExplored,
        streakDays: pointsData?.contribution_streak_days || 0,
        isTopContributor: (rankData?.rank_weekly || 100) <= 20,
        weeklyRank: rankData?.rank_weekly,
      });

      // Mark as shown
      localStorage.setItem('weeklySummaryLastShown', today.toISOString());
      
      // Show modal after a delay
      setTimeout(() => {
        setIsOpen(true);
        success();
      }, 2000);

    } catch (error) {
      console.error('Error loading weekly summary:', error);
    }
  };

  const handleClose = () => {
    mediumTap();
    setIsOpen(false);
  };

  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm rounded-2xl bg-card border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 to-transparent">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                  Weekly Recap
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {APP_COPY.weeklySummary.title}
              </h2>
            </div>

            {/* Stats */}
            <div className="p-6 pt-2 space-y-4">
              {/* Points Earned */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{APP_COPY.weeklySummary.pointsEarned}</p>
                    <p className="text-lg font-bold text-foreground">{data.pointsEarned.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-primary">
                  ≈${pointsToUsd(data.pointsEarned).toFixed(2)}
                </p>
              </div>

              {/* Areas & Streak */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <MapPin className="w-5 h-5 text-sky-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{data.areasExplored}</p>
                  <p className="text-xs text-muted-foreground">{APP_COPY.weeklySummary.areasExplored}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{data.streakDays}</p>
                  <p className="text-xs text-muted-foreground">{APP_COPY.weeklySummary.streakDays}</p>
                </div>
              </div>

              {/* Top Contributor Badge */}
              {data.isTopContributor && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-3">
                  <Award className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{APP_COPY.weeklySummary.topContributor}</p>
                    {data.weeklyRank && (
                      <p className="text-xs text-muted-foreground">Rank #{data.weeklyRank} this week</p>
                    )}
                  </div>
                </div>
              )}

              {/* Encouragement */}
              <p className="text-center text-sm text-muted-foreground">
                {APP_COPY.weeklySummary.encouragement}
              </p>

              {/* CTA */}
              <Button 
                onClick={handleClose} 
                className="w-full"
              >
                Keep Earning
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WeeklySummaryModal;
