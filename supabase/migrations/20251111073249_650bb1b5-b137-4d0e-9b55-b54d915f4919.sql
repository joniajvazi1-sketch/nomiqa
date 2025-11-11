-- Add access_token column to orders table for secure guest access
ALTER TABLE public.orders 
ADD COLUMN access_token UUID DEFAULT gen_random_uuid();

-- Create index for fast token lookups
CREATE INDEX idx_orders_access_token ON public.orders(access_token);

-- Update RLS policy to require either authentication OR valid access token
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR (email = get_user_email())
);

-- Add separate policy for guest access with token
-- Note: This will need to be implemented in the application layer
-- The RLS policy alone cannot check a token passed from the client
-- Instead, we'll create a secure function to retrieve orders by token