-- Add solana_wallet column to profiles table for reward distribution
ALTER TABLE public.profiles 
ADD COLUMN solana_wallet TEXT DEFAULT NULL;

-- Add an index for faster lookups
CREATE INDEX idx_profiles_solana_wallet ON public.profiles (solana_wallet) WHERE solana_wallet IS NOT NULL;

-- Add a check constraint to validate Solana wallet format (base58, 32-44 chars)
ALTER TABLE public.profiles
ADD CONSTRAINT valid_solana_wallet 
CHECK (solana_wallet IS NULL OR (length(solana_wallet) >= 32 AND length(solana_wallet) <= 44 AND solana_wallet ~ '^[1-9A-HJ-NP-Za-km-z]+$'));