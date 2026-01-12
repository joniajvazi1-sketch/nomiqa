-- Create speed_test_results table
CREATE TABLE public.speed_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  download_mbps DECIMAL(10, 2),
  upload_mbps DECIMAL(10, 2),
  latency_ms INTEGER,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  network_type TEXT,
  carrier TEXT,
  provider TEXT,
  error TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.speed_test_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own speed test results
CREATE POLICY "Users can view own speed test results"
ON public.speed_test_results
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own speed test results
CREATE POLICY "Users can insert own speed test results"
ON public.speed_test_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for querying user's daily tests
CREATE INDEX idx_speed_test_results_user_date 
ON public.speed_test_results (user_id, recorded_at);

-- Create function to get user's daily test count
CREATE OR REPLACE FUNCTION public.get_user_daily_speed_tests(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  test_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO test_count
  FROM public.speed_test_results
  WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE
    AND recorded_at < CURRENT_DATE + INTERVAL '1 day';
  
  RETURN COALESCE(test_count, 0);
END;
$$;