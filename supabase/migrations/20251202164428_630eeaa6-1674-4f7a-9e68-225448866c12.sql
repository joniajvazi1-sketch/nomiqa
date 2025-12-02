-- Change verification_token from uuid to text to support 6-digit OTP codes
ALTER TABLE public.affiliates 
ALTER COLUMN verification_token TYPE text USING verification_token::text;