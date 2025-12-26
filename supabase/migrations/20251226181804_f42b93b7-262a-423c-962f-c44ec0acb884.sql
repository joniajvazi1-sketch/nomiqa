
-- Create the missing trigger that moves PII from orders to orders_pii
CREATE TRIGGER sync_order_pii_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_pii();

-- Migrate existing PII data from orders to orders_pii for orders that don't have entries yet
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
  access_token_invalidated, created_at, now()
FROM public.orders
WHERE email != 'see-orders-pii@private'
  AND id NOT IN (SELECT id FROM public.orders_pii)
ON CONFLICT (id) DO NOTHING;

-- Clear PII from existing orders (replace with placeholder)
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

-- Allow users to view their own spending (fixes the transparency issue)
DROP POLICY IF EXISTS "Users can view their own spending" ON public.user_spending;
CREATE POLICY "Users can view their own spending" 
ON public.user_spending 
FOR SELECT 
USING (auth.uid() = user_id);
