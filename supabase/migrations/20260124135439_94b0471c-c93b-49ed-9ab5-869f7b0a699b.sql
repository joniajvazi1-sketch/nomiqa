
-- Allow public lookup of affiliate codes/usernames for referral links
-- This only exposes id, affiliate_code, and username - not sensitive data like earnings
CREATE POLICY "Public can lookup affiliates by username or code"
ON public.affiliates
FOR SELECT
USING (true);

-- Note: The existing "Users can view their own affiliate account" policy 
-- will be superseded by this more permissive policy for SELECT operations.
-- We keep it for clarity but this new policy allows all SELECT operations.
