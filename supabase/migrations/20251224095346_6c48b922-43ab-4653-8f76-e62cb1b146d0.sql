-- Fix esim_usage RLS Policy - Remove email-based access pattern
-- Guest access should go through get-order-by-token edge function

-- Drop the existing policy that has email-based access
DROP POLICY IF EXISTS "Authenticated users can view their own esim usage" ON public.esim_usage;

-- Create new stricter policy - users can ONLY view esim usage for their orders
-- where they are the owner (user_id matches their auth.uid())
CREATE POLICY "Users can view esim usage for their orders only"
ON public.esim_usage
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = esim_usage.order_id 
    AND orders.user_id = auth.uid()
  )
);