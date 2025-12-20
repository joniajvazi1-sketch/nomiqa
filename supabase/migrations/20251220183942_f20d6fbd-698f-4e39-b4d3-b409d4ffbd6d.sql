-- Add is_early_member column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_early_member boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_early_member IS 'True if user registered for the network before creating an account';