-- Create a secure view for profiles that excludes sensitive columns
-- This view can be used by clients instead of direct table access
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  user_id,
  username,
  email,
  email_verified,
  is_early_member,
  created_at,
  updated_at
  -- Explicitly excluding: verification_code, verification_code_expires_at, 
  -- password_reset_code, password_reset_expires_at
FROM public.profiles;

-- Grant select on the secure view to authenticated users
GRANT SELECT ON public.profiles_secure TO authenticated;

-- Create RLS policy for the secure view (views inherit table RLS but we add explicit policy)
-- Note: Views in PostgreSQL don't have RLS directly, they inherit from underlying table

-- Create a secure view for orders that excludes sensitive columns
CREATE OR REPLACE VIEW public.orders_secure AS
SELECT 
  id,
  user_id,
  product_id,
  status,
  email,
  full_name,
  package_name,
  data_amount,
  validity_days,
  total_amount_usd,
  iccid,
  lpa,
  qrcode,
  qr_code_url,
  qrcode_installation,
  manual_installation,
  activation_code,
  matching_id,
  sharing_link,
  sharing_access_code,
  created_at,
  updated_at
  -- Explicitly excluding: access_token, access_token_expires_at, access_token_invalidated,
  -- airlo_order_id, airlo_request_id, visitor_id, referral_code
FROM public.orders;

-- Grant select on the secure view to authenticated users
GRANT SELECT ON public.orders_secure TO authenticated;

-- Create PII cleanup function for GDPR/CCPA compliance
-- This anonymizes old order data while preserving business analytics
CREATE OR REPLACE FUNCTION public.cleanup_expired_order_pii()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Anonymize PII in orders older than 120 days that are completed
  -- This preserves order_id, product_id, amount for business analytics
  -- while removing customer identifiable information
  UPDATE public.orders
  SET 
    email = 'anonymized-' || id || '@deleted.privacy',
    full_name = 'ANONYMIZED',
    iccid = NULL,
    qrcode = NULL,
    qr_code_url = NULL,
    activation_code = NULL,
    lpa = NULL,
    matching_id = NULL,
    manual_installation = NULL,
    qrcode_installation = NULL,
    sharing_link = NULL,
    sharing_access_code = NULL,
    access_token_invalidated = true,
    visitor_id = NULL,
    referral_code = NULL,
    updated_at = now()
  WHERE 
    status IN ('completed', 'paid', 'delivered')
    AND created_at < now() - INTERVAL '120 days'
    AND email NOT LIKE 'anonymized-%@deleted.privacy';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log the cleanup for audit purposes
  INSERT INTO public.webhook_logs (event_type, payload, processed)
  VALUES (
    'pii_cleanup_executed',
    jsonb_build_object(
      'anonymized_orders', affected_count,
      'executed_at', now(),
      'retention_days', 120
    ),
    true
  );
  
  RETURN affected_count;
END;
$$;

-- Create function to allow users to request deletion of their own data (GDPR Article 17)
CREATE OR REPLACE FUNCTION public.request_data_deletion(requesting_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  orders_anonymized integer;
  profiles_deleted integer;
  spending_deleted integer;
  affiliates_deleted integer;
BEGIN
  -- Verify the requesting user matches the authenticated user
  IF requesting_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only request deletion for your own data';
  END IF;
  
  -- Anonymize all orders for this user
  UPDATE public.orders
  SET 
    email = 'deleted-user@privacy.request',
    full_name = 'DELETED BY USER REQUEST',
    iccid = NULL,
    qrcode = NULL,
    qr_code_url = NULL,
    activation_code = NULL,
    lpa = NULL,
    matching_id = NULL,
    manual_installation = NULL,
    qrcode_installation = NULL,
    sharing_link = NULL,
    sharing_access_code = NULL,
    access_token_invalidated = true,
    visitor_id = NULL,
    referral_code = NULL,
    user_id = NULL, -- Disassociate from user
    updated_at = now()
  WHERE user_id = requesting_user_id;
  
  GET DIAGNOSTICS orders_anonymized = ROW_COUNT;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS profiles_deleted = ROW_COUNT;
  
  -- Delete spending records
  DELETE FROM public.user_spending WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS spending_deleted = ROW_COUNT;
  
  -- Delete affiliate account if exists
  DELETE FROM public.affiliates WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS affiliates_deleted = ROW_COUNT;
  
  -- Log the deletion request for audit
  INSERT INTO public.webhook_logs (event_type, payload, processed)
  VALUES (
    'gdpr_deletion_request',
    jsonb_build_object(
      'user_id_hash', encode(sha256(requesting_user_id::text::bytea), 'hex'),
      'orders_anonymized', orders_anonymized,
      'profiles_deleted', profiles_deleted,
      'spending_deleted', spending_deleted,
      'affiliates_deleted', affiliates_deleted,
      'requested_at', now()
    ),
    true
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'orders_anonymized', orders_anonymized,
    'profiles_deleted', profiles_deleted,
    'spending_deleted', spending_deleted,
    'affiliates_deleted', affiliates_deleted
  );
END;
$$;