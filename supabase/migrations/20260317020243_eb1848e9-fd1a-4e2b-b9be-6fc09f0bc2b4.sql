-- Allow users to update their own daily check-ins (needed for upsert on conflict)
CREATE POLICY "Users can update their own check-ins"
ON public.daily_checkins
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);