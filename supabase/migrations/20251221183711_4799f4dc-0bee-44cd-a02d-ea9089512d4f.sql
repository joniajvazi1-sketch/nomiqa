-- Drop the network_registrations table as it's no longer used
-- Users now register through the standard Auth flow instead of email-only registration

-- First drop any policies on the table
DROP POLICY IF EXISTS "No direct inserts into network registrations" ON public.network_registrations;
DROP POLICY IF EXISTS "Users can check their own email registration" ON public.network_registrations;
DROP POLICY IF EXISTS "No public updates" ON public.network_registrations;
DROP POLICY IF EXISTS "No public deletes" ON public.network_registrations;

-- Drop the table
DROP TABLE IF EXISTS public.network_registrations;