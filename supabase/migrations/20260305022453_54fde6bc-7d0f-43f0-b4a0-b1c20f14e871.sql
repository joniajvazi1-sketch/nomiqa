
-- Revoke public API access from B2B materialized views
-- These should ONLY be accessible via the service role (edge functions)
REVOKE ALL ON public.coverage_gaps FROM anon, authenticated;
REVOKE ALL ON public.carrier_benchmarks FROM anon, authenticated;
REVOKE ALL ON public.network_congestion FROM anon, authenticated;
