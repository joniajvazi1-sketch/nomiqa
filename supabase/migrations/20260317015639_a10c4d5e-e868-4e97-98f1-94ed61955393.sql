-- Add unique constraint on daily_checkins to prevent duplicate check-ins
ALTER TABLE public.daily_checkins 
ADD CONSTRAINT daily_checkins_user_date_unique UNIQUE (user_id, check_in_date);