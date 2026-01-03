-- Add location proof columns to offline_contribution_queue
ALTER TABLE public.offline_contribution_queue
ADD COLUMN IF NOT EXISTS proof_hash text,
ADD COLUMN IF NOT EXISTS proof_version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS proof_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS location_hash text,
ADD COLUMN IF NOT EXISTS device_hash text,
ADD COLUMN IF NOT EXISTS network_hash text,
ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- Create index on proof_hash for efficient lookups
CREATE INDEX IF NOT EXISTS idx_contribution_proof_hash 
ON public.offline_contribution_queue(proof_hash) 
WHERE proof_hash IS NOT NULL;

-- Add comment explaining the proof system
COMMENT ON COLUMN public.offline_contribution_queue.proof_hash IS 'SHA-256 cryptographic proof combining location, device, network and server secret';
COMMENT ON COLUMN public.offline_contribution_queue.location_hash IS 'Truncated hash of lat/lon/timestamp for location verification';
COMMENT ON COLUMN public.offline_contribution_queue.device_hash IS 'Truncated hash of device fingerprint and carrier';
COMMENT ON COLUMN public.offline_contribution_queue.network_hash IS 'Truncated hash of signal strength and network type';