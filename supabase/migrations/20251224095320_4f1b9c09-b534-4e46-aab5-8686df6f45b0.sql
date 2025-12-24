-- Fix Orders Table RLS Policy - Remove email-based SELECT for guest orders
-- Guest orders should ONLY be accessible via the get-order-by-token edge function

-- Drop the existing policy that allows email-based access
DROP POLICY IF EXISTS "Authenticated users can view their own orders" ON public.orders;

-- Create new stricter policy - users can ONLY view orders where they are the owner
-- Guest orders (user_id IS NULL) are NOT accessible via direct queries
-- They must use the access_token via the get-order-by-token edge function
CREATE POLICY "Users can view their authenticated orders only"
ON public.orders
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Verify user_spending has proper SELECT policy (it should already exist)
-- The policy "Users can view their own spending" already restricts to auth.uid() = user_id
-- Just ensure it's active by dropping and recreating to be certain
DROP POLICY IF EXISTS "Users can view their own spending" ON public.user_spending;

CREATE POLICY "Users can view their own spending"
ON public.user_spending
FOR SELECT
USING (auth.uid() = user_id);