-- Create mining_logs table for mobile app backend storage
CREATE TABLE public.mining_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  signal_dbm INTEGER,
  network_type TEXT,
  carrier TEXT,
  device_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mining_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can INSERT their own logs
CREATE POLICY "Authenticated users can insert their own mining logs"
ON public.mining_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Restrictive policy: Block all SELECT access for regular users
-- Only service_role can read data (bypasses RLS)
CREATE POLICY "No user SELECT access to mining logs"
ON public.mining_logs
FOR SELECT
USING (false);

-- Block UPDATE access
CREATE POLICY "No user UPDATE access to mining logs"
ON public.mining_logs
FOR UPDATE
USING (false);

-- Block DELETE access  
CREATE POLICY "No user DELETE access to mining logs"
ON public.mining_logs
FOR DELETE
USING (false);

-- Add index on user_id for query performance
CREATE INDEX idx_mining_logs_user_id ON public.mining_logs(user_id);

-- Add index on timestamp for time-based queries
CREATE INDEX idx_mining_logs_timestamp ON public.mining_logs(timestamp DESC);