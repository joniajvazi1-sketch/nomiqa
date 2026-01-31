-- Fix profiles_safe view security
-- The view uses security_invoker=on so it inherits RLS from profiles table
-- We need to ensure only authenticated users can access it

-- Revoke all access first
REVOKE ALL ON public.profiles_safe FROM anon;
REVOKE ALL ON public.profiles_safe FROM authenticated;
REVOKE ALL ON public.profiles_safe FROM public;

-- Grant SELECT only to authenticated users
-- The security_invoker=on ensures RLS from profiles table is enforced
GRANT SELECT ON public.profiles_safe TO authenticated;