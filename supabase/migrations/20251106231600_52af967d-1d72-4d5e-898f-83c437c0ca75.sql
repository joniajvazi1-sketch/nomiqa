-- Create profiles table with username
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Add parent_affiliate_id to affiliates for multi-level tracking
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS parent_affiliate_id UUID REFERENCES public.affiliates(id);

-- Add commission_level to affiliate_referrals
ALTER TABLE public.affiliate_referrals
ADD COLUMN IF NOT EXISTS commission_level INTEGER DEFAULT 1;

-- Update affiliate_code to use username (we'll handle this in the application)
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_parent ON public.affiliates(parent_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Trigger for updating profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();