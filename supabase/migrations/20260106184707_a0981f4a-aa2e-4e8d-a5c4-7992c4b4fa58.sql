
-- Create referral audit log table to track all referral link visits
CREATE TABLE public.referral_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_code TEXT,
  affiliate_username TEXT,
  affiliate_id UUID,
  visitor_fingerprint TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no user access)
CREATE POLICY "No user access to referral audit log" 
ON public.referral_audit_log 
FOR ALL 
USING (false);

-- Add index for faster lookups
CREATE INDEX idx_referral_audit_affiliate_code ON public.referral_audit_log(affiliate_code);
CREATE INDEX idx_referral_audit_created_at ON public.referral_audit_log(created_at);

-- Add comment for documentation
COMMENT ON TABLE public.referral_audit_log IS 'Audit log for all referral link visits to help identify missed referrals';
