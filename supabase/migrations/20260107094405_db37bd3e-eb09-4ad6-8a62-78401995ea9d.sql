-- Add country_code field to profiles table for IP geolocation at signup
ALTER TABLE public.profiles
ADD COLUMN country_code text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.country_code IS 'ISO 3166-1 alpha-2 country code detected via IP geolocation at signup';