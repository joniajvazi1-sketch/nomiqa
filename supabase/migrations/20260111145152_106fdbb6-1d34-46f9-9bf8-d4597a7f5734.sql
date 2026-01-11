-- User personalized goals table
CREATE TABLE public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly')),
  target_points INTEGER NOT NULL DEFAULT 100,
  current_points INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, goal_type, period_start)
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals"
ON public.user_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
ON public.user_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.user_goals FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_goals_user_period ON public.user_goals(user_id, goal_type, period_start DESC);

-- Spin wheel results table
CREATE TABLE public.spin_wheel_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prize_type TEXT NOT NULL,
  prize_value INTEGER NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, spin_date)
);

-- Enable RLS
ALTER TABLE public.spin_wheel_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own spin results"
ON public.spin_wheel_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spin results"
ON public.spin_wheel_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spin results"
ON public.spin_wheel_results FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_spin_wheel_user_date ON public.spin_wheel_results(user_id, spin_date DESC);