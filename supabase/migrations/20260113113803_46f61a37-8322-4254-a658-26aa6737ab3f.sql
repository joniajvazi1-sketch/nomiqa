-- User contribution level tracking
CREATE TABLE public.user_contribution_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_level int DEFAULT 1,
  areas_mapped int DEFAULT 0,
  active_days int DEFAULT 0,
  level_achieved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_contribution_levels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own contribution level"
ON public.user_contribution_levels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contribution level"
ON public.user_contribution_levels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contribution level"
ON public.user_contribution_levels FOR UPDATE
USING (auth.uid() = user_id);

-- User data collection preferences
CREATE TABLE public.user_collection_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  collection_enabled boolean DEFAULT true,
  pause_until timestamptz,
  battery_saver_mode boolean DEFAULT false,
  low_power_collection boolean DEFAULT false,
  send_usage_stats boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_collection_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own collection preferences"
ON public.user_collection_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collection preferences"
ON public.user_collection_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collection preferences"
ON public.user_collection_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_contribution_levels_updated_at
BEFORE UPDATE ON public.user_contribution_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_collection_preferences_updated_at
BEFORE UPDATE ON public.user_collection_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();