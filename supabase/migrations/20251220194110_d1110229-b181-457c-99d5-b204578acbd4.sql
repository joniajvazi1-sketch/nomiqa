-- Security hardening: prevent direct client writes to PII tables.
-- Orders and network_registrations should only be written via backend functions (service role),
-- so attackers cannot bypass backend validation/rate limiting by writing through the anon key.

-- 1) Lock down public.network_registrations INSERT
DROP POLICY IF EXISTS "Anyone can register" ON public.network_registrations;

CREATE POLICY "No direct inserts into network registrations"
ON public.network_registrations
FOR INSERT
WITH CHECK (false);

-- 2) Lock down public.orders INSERT
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

CREATE POLICY "No direct inserts into orders"
ON public.orders
FOR INSERT
WITH CHECK (false);
