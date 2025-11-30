-- Enable realtime for affiliate_referrals table
ALTER TABLE public.affiliate_referrals REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_referrals;