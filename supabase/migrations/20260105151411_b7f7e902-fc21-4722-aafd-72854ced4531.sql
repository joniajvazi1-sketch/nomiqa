-- Add data_quality_score column to signal_logs table
-- This enables quality-based reward multipliers and data valuation

ALTER TABLE public.signal_logs 
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT NULL;

-- Add index for querying by quality score
CREATE INDEX IF NOT EXISTS idx_signal_logs_quality_score 
ON public.signal_logs (data_quality_score) 
WHERE data_quality_score IS NOT NULL;

-- Add is_indoor flag for indoor bonus detection
ALTER TABLE public.signal_logs 
ADD COLUMN IF NOT EXISTS is_indoor BOOLEAN DEFAULT FALSE;

-- Add is_rare_location flag for rare location bonus
ALTER TABLE public.signal_logs 
ADD COLUMN IF NOT EXISTS is_rare_location BOOLEAN DEFAULT FALSE;

-- Comment explaining the scoring system
COMMENT ON COLUMN public.signal_logs.data_quality_score IS 
'Data quality score (0-100). Factors: network type (5G=25pts), metrics completeness (30pts), GPS accuracy (15pts), speed test (15pts), context bonus (15pts)';