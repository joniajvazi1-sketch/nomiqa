
-- Allow affiliates to view basic profile info for users they referred
CREATE POLICY "Affiliates can view referred users profiles"
ON public.profiles
FOR SELECT
USING (
  -- User can see their own profile
  auth.uid() = user_id
  OR
  -- Affiliates can see profiles of users they referred
  EXISTS (
    SELECT 1 FROM public.affiliate_referrals ar
    JOIN public.affiliates a ON ar.affiliate_id = a.id
    WHERE ar.registered_user_id = profiles.user_id
    AND a.user_id = auth.uid()
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
