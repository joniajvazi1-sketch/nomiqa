-- Fix 1: Add authorization check to get_user_daily_speed_tests function
CREATE OR REPLACE FUNCTION public.get_user_daily_speed_tests(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  test_count INTEGER;
BEGIN
  -- Security check: Only allow users to query their own data or admins
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: can only query your own speed test count';
  END IF;

  SELECT COUNT(*) INTO test_count
  FROM public.speed_test_results
  WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE
    AND recorded_at < CURRENT_DATE + INTERVAL '1 day';
  
  RETURN COALESCE(test_count, 0);
END;
$function$;

-- Fix 2: Revoke anonymous access to profiles_safe view (defense-in-depth)
REVOKE SELECT ON public.profiles_safe FROM anon;
REVOKE SELECT ON public.profiles_safe FROM public;

-- Ensure only authenticated users can access the view
GRANT SELECT ON public.profiles_safe TO authenticated;