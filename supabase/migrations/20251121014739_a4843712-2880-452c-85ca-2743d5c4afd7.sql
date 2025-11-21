-- Add expiration and status columns to orders table for improved access token security
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_token_invalidated BOOLEAN DEFAULT FALSE;

-- Set expiration to 90 days from creation for existing orders
UPDATE public.orders 
SET access_token_expires_at = created_at + INTERVAL '90 days'
WHERE access_token_expires_at IS NULL;

-- Create function to set token expiration on new orders
CREATE OR REPLACE FUNCTION public.set_access_token_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.access_token_expires_at IS NULL THEN
    NEW.access_token_expires_at := NOW() + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set expiration on new orders
DROP TRIGGER IF EXISTS set_access_token_expiry_trigger ON public.orders;
CREATE TRIGGER set_access_token_expiry_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_access_token_expiry();

-- Add verification columns to affiliates table for email verification
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token UUID,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Update existing affiliates to be verified (grandfathered in)
UPDATE public.affiliates 
SET email_verified = TRUE 
WHERE email_verified IS FALSE;