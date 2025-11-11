-- Create table to track processed webhook requests (prevents replay attacks)
CREATE TABLE IF NOT EXISTS public.processed_webhook_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  webhook_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (only system should access this)
ALTER TABLE public.processed_webhook_requests ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_webhook_transaction_id 
ON public.processed_webhook_requests(transaction_id);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_processed_webhook_created_at 
ON public.processed_webhook_requests(created_at);

-- Auto-cleanup function to remove old processed requests (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.processed_webhook_requests
  WHERE created_at < now() - interval '30 days';
END;
$$;