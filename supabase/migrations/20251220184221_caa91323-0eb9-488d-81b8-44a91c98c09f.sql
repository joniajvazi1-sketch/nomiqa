-- Drop the overly restrictive SELECT policy
DROP POLICY IF EXISTS "No public read" ON public.network_registrations;

-- Create a new policy that allows users to check if their own email is registered
-- This is needed for the early member check during signup
CREATE POLICY "Users can check their own email registration" 
ON public.network_registrations 
FOR SELECT 
USING (
  -- Allow checking by email when the email matches the authenticated user's email
  -- or when called via service role (for edge functions)
  email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);