-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Create new policy that allows:
-- 1. Authenticated users to create orders for themselves
-- 2. Anyone to create orders if they provide an email (guest checkout)
CREATE POLICY "Allow order creation"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Authenticated users must match their own user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Guest checkout: allow if email is provided and user_id is null
  (auth.uid() IS NULL AND user_id IS NULL AND email IS NOT NULL)
);