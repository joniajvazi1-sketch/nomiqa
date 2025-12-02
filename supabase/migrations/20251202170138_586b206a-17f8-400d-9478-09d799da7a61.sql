-- Create table to track email rate limits per recipient
CREATE TABLE public.email_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_email_rate_limits_lookup ON public.email_rate_limits (email, sent_at);

-- Create function to clean up old records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_email_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_rate_limits
  WHERE sent_at < now() - interval '24 hours';
END;
$$;

-- Enable RLS (restrict all access - only edge functions with service role can access)
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - this table is only accessed by edge functions with service role key