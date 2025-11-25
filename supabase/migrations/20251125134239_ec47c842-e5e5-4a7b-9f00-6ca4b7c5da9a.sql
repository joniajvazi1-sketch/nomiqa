-- Add email verification columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS verification_code_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS password_reset_code text,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at timestamp with time zone;

-- Add verification code expiration to affiliates table
ALTER TABLE affiliates 
  ADD COLUMN IF NOT EXISTS verification_code_expires_at timestamp with time zone;