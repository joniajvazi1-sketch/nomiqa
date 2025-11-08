-- Add source tracking to affiliate_referrals
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS commission_level INTEGER DEFAULT 1;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_source ON affiliate_referrals(source);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_level ON affiliate_referrals(commission_level);