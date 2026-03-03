CREATE OR REPLACE FUNCTION public.get_all_time_city_count()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT (FLOOR(latitude / 0.25)::text || ',' || FLOOR(longitude / 0.25)::text))::integer
  FROM public.signal_logs
  WHERE latitude != 0 AND longitude != 0;
$$;