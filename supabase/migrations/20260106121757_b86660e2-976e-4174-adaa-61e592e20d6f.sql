-- Add columns for speed test and latency error tracking
ALTER TABLE signal_logs 
ADD COLUMN IF NOT EXISTS speed_test_error TEXT,
ADD COLUMN IF NOT EXISTS speed_test_provider TEXT,
ADD COLUMN IF NOT EXISTS latency_error TEXT,
ADD COLUMN IF NOT EXISTS latency_provider TEXT,
ADD COLUMN IF NOT EXISTS latency_method TEXT;

-- Add comment for documentation
COMMENT ON COLUMN signal_logs.speed_test_error IS 'Error message if speed test failed';
COMMENT ON COLUMN signal_logs.speed_test_provider IS 'Provider used for speed test (nomiqa, cloudflare, fast.com)';
COMMENT ON COLUMN signal_logs.latency_error IS 'Error message if latency test failed';
COMMENT ON COLUMN signal_logs.latency_provider IS 'Provider used for latency test (nomiqa, cloudflare)';
COMMENT ON COLUMN signal_logs.latency_method IS 'Method used for latency test (HEAD, fetch)';