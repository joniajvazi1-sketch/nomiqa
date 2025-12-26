-- Create a private table for order PII that users cannot directly query
-- Only backend functions (service role) can access this table

CREATE TABLE IF NOT EXISTS public.orders_pii (
  id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  iccid text,
  lpa text,
  qrcode text,
  qr_code_url text,
  activation_code text,
  matching_id text,
  manual_installation text,
  qrcode_installation text,
  sharing_link text,
  sharing_access_code text,
  access_token uuid,
  access_token_expires_at timestamptz,
  access_token_invalidated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS but DENY all user access - only service role can access
ALTER TABLE public.orders_pii ENABLE ROW LEVEL SECURITY;

-- Block ALL user access to this table (only service role bypasses RLS)
CREATE POLICY "Block all user access to orders_pii"
  ON public.orders_pii
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Migrate existing PII data from orders to orders_pii
INSERT INTO public.orders_pii (
  id, email, full_name, iccid, lpa, qrcode, qr_code_url, 
  activation_code, matching_id, manual_installation, qrcode_installation,
  sharing_link, sharing_access_code, access_token, access_token_expires_at,
  access_token_invalidated, created_at, updated_at
)
SELECT 
  id, email, full_name, iccid, lpa, qrcode, qr_code_url,
  activation_code, matching_id, manual_installation, qrcode_installation,
  sharing_link, sharing_access_code, access_token, access_token_expires_at,
  access_token_invalidated, created_at, updated_at
FROM public.orders
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  iccid = EXCLUDED.iccid,
  lpa = EXCLUDED.lpa,
  qrcode = EXCLUDED.qrcode,
  qr_code_url = EXCLUDED.qr_code_url,
  activation_code = EXCLUDED.activation_code,
  matching_id = EXCLUDED.matching_id,
  manual_installation = EXCLUDED.manual_installation,
  qrcode_installation = EXCLUDED.qrcode_installation,
  sharing_link = EXCLUDED.sharing_link,
  sharing_access_code = EXCLUDED.sharing_access_code,
  access_token = EXCLUDED.access_token,
  access_token_expires_at = EXCLUDED.access_token_expires_at,
  access_token_invalidated = EXCLUDED.access_token_invalidated,
  updated_at = EXCLUDED.updated_at;

-- Update the orders table: set PII columns to anonymized values
-- (We keep the columns for now for compatibility but they'll be empty for new orders)
UPDATE public.orders 
SET 
  email = 'see-orders-pii@private',
  full_name = NULL,
  iccid = NULL,
  lpa = NULL,
  qrcode = NULL,
  qr_code_url = NULL,
  activation_code = NULL,
  matching_id = NULL,
  manual_installation = NULL,
  qrcode_installation = NULL,
  sharing_link = NULL,
  sharing_access_code = NULL
WHERE email != 'see-orders-pii@private';

-- Drop the orders_secure view as it's no longer needed
DROP VIEW IF EXISTS public.orders_secure;

-- Drop the profiles_secure view as it's also causing scan issues
DROP VIEW IF EXISTS public.profiles_secure;

-- Create trigger to sync PII to private table on insert/update
CREATE OR REPLACE FUNCTION public.sync_order_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT, create the PII record
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.orders_pii (
      id, email, full_name, iccid, lpa, qrcode, qr_code_url,
      activation_code, matching_id, manual_installation, qrcode_installation,
      sharing_link, sharing_access_code, access_token, access_token_expires_at,
      access_token_invalidated
    ) VALUES (
      NEW.id, NEW.email, NEW.full_name, NEW.iccid, NEW.lpa, NEW.qrcode, NEW.qr_code_url,
      NEW.activation_code, NEW.matching_id, NEW.manual_installation, NEW.qrcode_installation,
      NEW.sharing_link, NEW.sharing_access_code, NEW.access_token, NEW.access_token_expires_at,
      NEW.access_token_invalidated
    );
    
    -- Clear PII from main orders table immediately
    NEW.email := 'see-orders-pii@private';
    NEW.full_name := NULL;
    NEW.iccid := NULL;
    NEW.lpa := NULL;
    NEW.qrcode := NULL;
    NEW.qr_code_url := NULL;
    NEW.activation_code := NULL;
    NEW.matching_id := NULL;
    NEW.manual_installation := NULL;
    NEW.qrcode_installation := NULL;
    NEW.sharing_link := NULL;
    NEW.sharing_access_code := NULL;
    
  -- On UPDATE, sync PII changes
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.orders_pii SET
      email = COALESCE(NEW.email, OLD.email),
      full_name = COALESCE(NEW.full_name, (SELECT full_name FROM orders_pii WHERE id = NEW.id)),
      iccid = COALESCE(NEW.iccid, (SELECT iccid FROM orders_pii WHERE id = NEW.id)),
      lpa = COALESCE(NEW.lpa, (SELECT lpa FROM orders_pii WHERE id = NEW.id)),
      qrcode = COALESCE(NEW.qrcode, (SELECT qrcode FROM orders_pii WHERE id = NEW.id)),
      qr_code_url = COALESCE(NEW.qr_code_url, (SELECT qr_code_url FROM orders_pii WHERE id = NEW.id)),
      activation_code = COALESCE(NEW.activation_code, (SELECT activation_code FROM orders_pii WHERE id = NEW.id)),
      matching_id = COALESCE(NEW.matching_id, (SELECT matching_id FROM orders_pii WHERE id = NEW.id)),
      manual_installation = COALESCE(NEW.manual_installation, (SELECT manual_installation FROM orders_pii WHERE id = NEW.id)),
      qrcode_installation = COALESCE(NEW.qrcode_installation, (SELECT qrcode_installation FROM orders_pii WHERE id = NEW.id)),
      sharing_link = COALESCE(NEW.sharing_link, (SELECT sharing_link FROM orders_pii WHERE id = NEW.id)),
      sharing_access_code = COALESCE(NEW.sharing_access_code, (SELECT sharing_access_code FROM orders_pii WHERE id = NEW.id)),
      access_token = COALESCE(NEW.access_token, (SELECT access_token FROM orders_pii WHERE id = NEW.id)),
      access_token_expires_at = COALESCE(NEW.access_token_expires_at, (SELECT access_token_expires_at FROM orders_pii WHERE id = NEW.id)),
      access_token_invalidated = COALESCE(NEW.access_token_invalidated, (SELECT access_token_invalidated FROM orders_pii WHERE id = NEW.id)),
      updated_at = now()
    WHERE id = NEW.id;
    
    -- Clear PII from main orders table
    NEW.email := 'see-orders-pii@private';
    NEW.full_name := NULL;
    NEW.iccid := NULL;
    NEW.lpa := NULL;
    NEW.qrcode := NULL;
    NEW.qr_code_url := NULL;
    NEW.activation_code := NULL;
    NEW.matching_id := NULL;
    NEW.manual_installation := NULL;
    NEW.qrcode_installation := NULL;
    NEW.sharing_link := NULL;
    NEW.sharing_access_code := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: We create this as a BEFORE trigger so it can modify NEW values
CREATE TRIGGER orders_pii_sync_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_pii();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_pii_access_token ON public.orders_pii(access_token) WHERE access_token IS NOT NULL;

-- Remove email column from profiles table and keep only the one from auth.users
-- (The get_user_email function already retrieves from auth.users, so we don't need to duplicate it)
-- Note: We keep the profiles.email for backwards compatibility, but it won't be populated going forward