-- Add registration tracking columns to affiliate_referrals
ALTER TABLE public.affiliate_referrals 
ADD COLUMN registered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.affiliate_referrals 
ADD COLUMN registered_user_id UUID DEFAULT NULL;

-- Add total_registrations counter to affiliates
ALTER TABLE public.affiliates 
ADD COLUMN total_registrations INTEGER DEFAULT 0;

-- Remove total_clicks column from affiliates (no longer needed)
ALTER TABLE public.affiliates DROP COLUMN total_clicks;