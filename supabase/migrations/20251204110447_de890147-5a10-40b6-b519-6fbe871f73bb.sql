-- Enable realtime for orders table to ensure instant updates work
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;