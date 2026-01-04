-- Add unique constraint on username in profiles table to prevent duplicates
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));