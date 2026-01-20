-- Fix: Token waitlist public INSERT vulnerability
-- Change policy to require rate limiting via edge function instead of direct table access
-- The waitlist should still allow public submissions but via a controlled edge function

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can join token waitlist" ON public.token_waitlist;

-- Create a new policy that blocks direct inserts (must go through edge function)
-- Edge function will use service role key to bypass RLS
CREATE POLICY "Waitlist inserts via edge function only" ON public.token_waitlist
FOR INSERT
WITH CHECK (false);

-- Note: The join-waitlist edge function uses service role key, so it bypasses RLS
-- This means public users cannot directly INSERT into the table, only via the controlled endpoint