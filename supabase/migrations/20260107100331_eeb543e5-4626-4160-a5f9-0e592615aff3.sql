
-- Drop the overly permissive affiliate policy
DROP POLICY IF EXISTS "Affiliates can view referred users profiles" ON public.profiles;

-- Recreate the original self-only view policy
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);
