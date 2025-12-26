-- Harden permissions for secure views and ensure they always run as invoker (respecting underlying RLS)

-- Ensure invoker security is set (idempotent)
ALTER VIEW IF EXISTS public.profiles_secure SET (security_invoker = true);
ALTER VIEW IF EXISTS public.orders_secure SET (security_invoker = true);

-- Remove any broad/default privileges (defense-in-depth)
REVOKE ALL ON public.profiles_secure FROM PUBLIC;
REVOKE ALL ON public.orders_secure FROM PUBLIC;

REVOKE ALL ON public.profiles_secure FROM anon;
REVOKE ALL ON public.orders_secure FROM anon;

REVOKE ALL ON public.profiles_secure FROM authenticated;
REVOKE ALL ON public.orders_secure FROM authenticated;

-- Re-grant only what the client should ever need
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.orders_secure TO authenticated;