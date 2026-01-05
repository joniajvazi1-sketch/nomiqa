-- Create challenges table for daily/weekly challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'special')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  reward_points NUMERIC NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('speed_tests', 'distance_meters', 'streak_days', 'data_points', 'sessions')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user challenge progress table
CREATE TABLE public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  current_value NUMERIC DEFAULT 0,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id, period_start)
);

-- Create leaderboard cache for performance
CREATE TABLE public.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  username TEXT,
  total_points NUMERIC DEFAULT 0,
  weekly_points NUMERIC DEFAULT 0,
  monthly_points NUMERIC DEFAULT 0,
  total_distance_meters NUMERIC DEFAULT 0,
  rank_all_time INTEGER,
  rank_weekly INTEGER,
  rank_monthly INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Challenges policies (public read, no user write)
CREATE POLICY "Challenges are viewable by everyone"
ON public.challenges FOR SELECT
USING (true);

-- User challenge progress policies
CREATE POLICY "Deny anonymous access to user_challenge_progress"
ON public.user_challenge_progress FOR ALL
USING (false);

CREATE POLICY "Users can view their own challenge progress"
ON public.user_challenge_progress FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress"
ON public.user_challenge_progress FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
ON public.user_challenge_progress FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "No challenge progress deletions by users"
ON public.user_challenge_progress FOR DELETE
USING (false);

-- Leaderboard cache policies (public read for leaderboard display)
CREATE POLICY "Leaderboard is viewable by authenticated users"
ON public.leaderboard_cache FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own leaderboard entry"
ON public.leaderboard_cache FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entry"
ON public.leaderboard_cache FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "No leaderboard deletions by users"
ON public.leaderboard_cache FOR DELETE
USING (false);

-- Seed initial challenges
INSERT INTO public.challenges (type, title, description, target_value, reward_points, metric_type) VALUES
('daily', 'Speed Demon', 'Run 3 speed tests today', 3, 20, 'speed_tests'),
('daily', 'Distance Walker', 'Map 500m of new area', 500, 30, 'distance_meters'),
('daily', 'Data Collector', 'Collect 50 data points', 50, 25, 'data_points'),
('weekly', 'Streak Master', 'Maintain a 7-day contribution streak', 7, 200, 'streak_days'),
('weekly', 'Marathon Mapper', 'Map 5km total distance', 5000, 150, 'distance_meters'),
('weekly', 'Session Pro', 'Complete 10 scanning sessions', 10, 100, 'sessions'),
('special', 'First Steps', 'Complete your first speed test', 1, 50, 'speed_tests');

-- Create function to update leaderboard rankings
CREATE OR REPLACE FUNCTION public.update_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE leaderboard_cache lc
  SET rank_all_time = ranked.rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
    FROM leaderboard_cache
  ) ranked
  WHERE lc.user_id = ranked.user_id;
  
  UPDATE leaderboard_cache lc
  SET rank_weekly = ranked.rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY weekly_points DESC) as rank
    FROM leaderboard_cache
  ) ranked
  WHERE lc.user_id = ranked.user_id;
  
  UPDATE leaderboard_cache lc
  SET rank_monthly = ranked.rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY monthly_points DESC) as rank
    FROM leaderboard_cache
  ) ranked
  WHERE lc.user_id = ranked.user_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_challenges_active ON public.challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_user_challenge_progress_user ON public.user_challenge_progress(user_id);
CREATE INDEX idx_user_challenge_progress_challenge ON public.user_challenge_progress(challenge_id);
CREATE INDEX idx_leaderboard_cache_points ON public.leaderboard_cache(total_points DESC);
CREATE INDEX idx_leaderboard_cache_weekly ON public.leaderboard_cache(weekly_points DESC);
CREATE INDEX idx_leaderboard_cache_rank ON public.leaderboard_cache(rank_all_time);