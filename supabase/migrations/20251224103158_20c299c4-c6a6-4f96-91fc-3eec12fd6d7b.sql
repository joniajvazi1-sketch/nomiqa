-- Add email column to profiles for efficient lookups (prevents O(n) DoS vulnerability)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Backfill email from auth.users for existing profiles
-- This uses a function to safely populate existing data
CREATE OR REPLACE FUNCTION public.backfill_profile_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  user_email TEXT;
BEGIN
  FOR profile_record IN SELECT id, user_id FROM public.profiles WHERE email IS NULL
  LOOP
    SELECT email INTO user_email FROM auth.users WHERE id = profile_record.user_id;
    IF user_email IS NOT NULL THEN
      UPDATE public.profiles SET email = user_email WHERE id = profile_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Run the backfill
SELECT public.backfill_profile_emails();

-- Drop the temporary function after use
DROP FUNCTION IF EXISTS public.backfill_profile_emails();

-- Create trigger to auto-populate email on profile insert
CREATE OR REPLACE FUNCTION public.set_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profile_email_trigger ON public.profiles;
CREATE TRIGGER set_profile_email_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_email();