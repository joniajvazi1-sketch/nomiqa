-- Step 1: Add confidence_score column first
ALTER TABLE signal_logs 
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT NULL;

COMMENT ON COLUMN signal_logs.confidence_score IS 'Server-computed 0-100 confidence score combining GPS accuracy, signal validity, device trust';

CREATE INDEX IF NOT EXISTS idx_signal_logs_confidence 
  ON signal_logs(confidence_score) WHERE confidence_score IS NOT NULL;