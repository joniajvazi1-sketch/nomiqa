-- ================================================
-- SECURITY FIX: Address Multiple Security Vulnerabilities
-- ================================================

-- 1. Fix profiles_safe view - Make it owner-only accessible
-- The view was created without RLS, exposing all user emails/wallets
-- Solution: Drop view and recreate with proper RLS-enabled table underneath

-- First, drop the existing view
DROP VIEW IF EXISTS public.profiles_safe;

-- Recreate as a secure view that only returns current user's data
CREATE VIEW public.profiles_safe AS 
SELECT 
  id,
  user_id,
  username,
  email,
  email_verified,
  solana_wallet,
  is_early_member,
  country_code,
  data_consent_version,
  data_consent_accepted_at,
  created_at,
  updated_at
FROM public.profiles
WHERE user_id = auth.uid();

-- Grant access to authenticated users only
REVOKE ALL ON public.profiles_safe FROM anon;
REVOKE ALL ON public.profiles_safe FROM public;
GRANT SELECT ON public.profiles_safe TO authenticated;

-- 2. Fix referral_commissions - Add explicit DENY policies for INSERT/UPDATE/DELETE
-- Currently only has SELECT policy, need to block modifications

CREATE POLICY "No user inserts to referral_commissions"
ON public.referral_commissions
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No user updates to referral_commissions"
ON public.referral_commissions
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No user deletes from referral_commissions"
ON public.referral_commissions
FOR DELETE
TO authenticated
USING (false);

-- 3. Add audit logging to has_role function for admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_exists boolean;
BEGIN
  -- Check if role exists
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) INTO role_exists;
  
  -- Log admin role checks for audit trail (non-blocking)
  IF _role = 'admin' THEN
    BEGIN
      INSERT INTO public.security_audit_log (user_id, event_type, severity, details)
      VALUES (
        _user_id, 
        'admin_role_check', 
        CASE WHEN role_exists THEN 'info' ELSE 'warn' END,
        jsonb_build_object(
          'role_requested', _role::text,
          'role_granted', role_exists,
          'checked_at', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail the role check if logging fails
      NULL;
    END;
  END IF;
  
  RETURN role_exists;
END;
$$;