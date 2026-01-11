-- Daily check-in system table
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bonus_points INTEGER NOT NULL DEFAULT 10,
  streak_day INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- Enable RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Users can view their own check-ins
CREATE POLICY "Users can view their own check-ins"
ON public.daily_checkins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert their own check-ins"
ON public.daily_checkins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins(user_id, check_in_date DESC);