-- Add explicit DENY policies for anonymous users on sensitive tables
-- This provides defense-in-depth security following the principle of least privilege

-- Profiles table - deny anonymous access
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Orders table - deny anonymous access  
CREATE POLICY "Deny anonymous access to orders"
ON public.orders
FOR ALL
TO anon
USING (false);

-- User spending table - deny anonymous access
CREATE POLICY "Deny anonymous access to user_spending"
ON public.user_spending
FOR ALL
TO anon
USING (false);

-- Affiliates table - deny anonymous access (contains PII)
CREATE POLICY "Deny anonymous access to affiliates"
ON public.affiliates
FOR ALL
TO anon
USING (false);

-- Affiliate referrals table - deny anonymous access
CREATE POLICY "Deny anonymous access to affiliate_referrals"
ON public.affiliate_referrals
FOR ALL
TO anon
USING (false);

-- ESim usage table - deny anonymous access
CREATE POLICY "Deny anonymous access to esim_usage"
ON public.esim_usage
FOR ALL
TO anon
USING (false);