-- Drop the older overloaded versions of points RPCs that cause
-- "Could not choose the best candidate function" errors when the
-- native app calls them with the new p_app_version parameter.
-- We keep ONLY the latest signatures used by the live mobile app.

DROP FUNCTION IF EXISTS public.add_referral_points(p_user_id uuid, p_points integer, p_source text);

DROP FUNCTION IF EXISTS public.add_points_with_cap(p_user_id uuid, p_base_points integer, p_source text);
DROP FUNCTION IF EXISTS public.add_points_with_cap(p_user_id uuid, p_base_points integer, p_source text, p_session_hours numeric);