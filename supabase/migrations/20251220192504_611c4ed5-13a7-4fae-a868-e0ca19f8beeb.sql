-- Fix: Update network_registrations SELECT policy to use get_user_email() for consistency
-- This prevents potential auth context bypass and adds defense in depth

DROP POLICY IF EXISTS "Users can check their own email registration" ON public.network_registrations;

CREATE POLICY "Users can check their own email registration" 
ON public.network_registrations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND email = get_user_email()
);