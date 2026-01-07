-- Fix RLS policies on affiliates table to use ONLY user_id, not email
-- This eliminates the get_user_email() function dependency which could leak email info

-- Drop existing policies that use get_user_email()
DROP POLICY IF EXISTS "Authenticated users can view their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Authenticated users can create their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Authenticated users can update their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view their own referrals" ON public.affiliate_referrals;

-- Recreate policies using ONLY user_id (the authoritative ownership field)
-- Users MUST have user_id set to access their affiliate account

-- SELECT: Users can only view affiliate records where user_id matches their auth.uid()
CREATE POLICY "Users can view their own affiliate account"
ON public.affiliates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can only create affiliate records with their own user_id
CREATE POLICY "Users can create their own affiliate account"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update affiliate records where user_id matches
CREATE POLICY "Users can update their own affiliate account"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix affiliate_referrals policy - use a subquery that checks user_id only
CREATE POLICY "Affiliates can view their own referrals"
ON public.affiliate_referrals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM affiliates
    WHERE affiliates.id = affiliate_referrals.affiliate_id
    AND affiliates.user_id = auth.uid()
  )
);