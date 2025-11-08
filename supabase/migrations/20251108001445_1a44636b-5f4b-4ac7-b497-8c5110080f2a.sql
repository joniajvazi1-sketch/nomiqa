-- Add username column to affiliates table for custom referral links
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_affiliates_username ON affiliates(username);

-- Update existing affiliates to have a username based on their email (temporary)
UPDATE affiliates 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL;