-- Add visitor_id column to orders table for proper affiliate tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- Add referral_code column to orders table to store the affiliate code at purchase time
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_visitor_id ON public.orders(visitor_id);

-- Add partial unique constraint to prevent duplicate order attributions (only for non-null order_ids)
CREATE UNIQUE INDEX IF NOT EXISTS unique_order_attribution 
ON public.affiliate_referrals(order_id) 
WHERE order_id IS NOT NULL;