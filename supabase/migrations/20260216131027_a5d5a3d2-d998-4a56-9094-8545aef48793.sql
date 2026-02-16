
-- Table to track one-time social follow reward claims
CREATE TABLE public.social_task_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'instagram', 'facebook', 'tiktok')),
  points_awarded INTEGER NOT NULL DEFAULT 50,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_task_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view own social claims"
  ON public.social_task_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own claims (one per platform enforced by UNIQUE)
CREATE POLICY "Users can claim social tasks"
  ON public.social_task_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No updates or deletes
CREATE POLICY "No updates to social claims"
  ON public.social_task_claims FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from social claims"
  ON public.social_task_claims FOR DELETE
  USING (false);
