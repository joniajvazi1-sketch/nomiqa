-- Enable realtime for esim_usage table
ALTER TABLE public.esim_usage REPLICA IDENTITY FULL;

-- The table is already part of the supabase_realtime publication by default
-- But we can explicitly add it to be sure
ALTER PUBLICATION supabase_realtime ADD TABLE public.esim_usage;