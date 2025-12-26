-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "No user SELECT access to mining logs" ON public.mining_logs;

-- Create a new SELECT policy allowing users to view their own mining logs
CREATE POLICY "Users can view their own mining logs"
ON public.mining_logs
FOR SELECT
USING (auth.uid() = user_id);