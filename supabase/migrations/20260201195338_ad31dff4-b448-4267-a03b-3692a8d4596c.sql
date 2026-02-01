
-- Ensure anon cannot access profiles_safe view at all
-- We need to revoke from the public role which grants to all

-- Revoke all from anon explicitly with CASCADE
REVOKE ALL PRIVILEGES ON public.profiles_safe FROM anon;

-- Also revoke from public role (which cascades to anon)
REVOKE ALL PRIVILEGES ON public.profiles_safe FROM public;

-- Re-grant to authenticated only
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Also grant to service_role for edge functions
GRANT SELECT ON public.profiles_safe TO service_role;

-- Alter default privileges if needed for future grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
REVOKE SELECT ON TABLES FROM anon;
