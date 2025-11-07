-- Secure affiliate_referrals table with proper RLS policies

-- Drop existing policies if any
DROP POLICY IF EXISTS "Affiliates can view their own referrals" ON public.affiliate_referrals;

-- Add INSERT policy that denies direct client inserts
CREATE POLICY "Only service role can insert referrals"
ON public.affiliate_referrals
FOR INSERT
WITH CHECK (false);

-- Add UPDATE policy to prevent modification
CREATE POLICY "No updates allowed on referrals"
ON public.affiliate_referrals
FOR UPDATE
USING (false);

-- Add DELETE policy to prevent deletion
CREATE POLICY "No deletes allowed on referrals"
ON public.affiliate_referrals
FOR DELETE
USING (false);

-- Re-add SELECT policy for affiliates to view their own referrals
CREATE POLICY "Affiliates can view their own referrals"
ON public.affiliate_referrals
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.affiliates
    WHERE affiliates.id = affiliate_referrals.affiliate_id
    AND (affiliates.user_id = auth.uid() OR affiliates.email = get_user_email())
  )
);