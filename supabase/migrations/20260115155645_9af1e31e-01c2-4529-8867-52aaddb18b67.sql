-- Add streak tracking for daily challenge completion
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS daily_challenge_streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_all_daily_completed_date date;

-- Add a comment explaining the columns
COMMENT ON COLUMN public.user_points.daily_challenge_streak_days IS 'Consecutive days of completing ALL daily challenges';
COMMENT ON COLUMN public.user_points.last_all_daily_completed_date IS 'Date when user last completed all daily challenges';