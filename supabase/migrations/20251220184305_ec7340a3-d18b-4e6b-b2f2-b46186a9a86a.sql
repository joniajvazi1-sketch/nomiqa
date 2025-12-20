-- Drop and recreate affiliates policies to use get_user_email() function instead of direct auth.users query

-- SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view their own affiliate account" ON public.affiliates;
CREATE POLICY "Authenticated users can view their own affiliate account" 
ON public.affiliates 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    (user_id IS NULL AND email = get_user_email())
  )
);

-- INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create their own affiliate account" ON public.affiliates;
CREATE POLICY "Authenticated users can create their own affiliate account" 
ON public.affiliates 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    email = get_user_email()
  )
);

-- UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update their own affiliate account" ON public.affiliates;
CREATE POLICY "Authenticated users can update their own affiliate account" 
ON public.affiliates 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    email = get_user_email()
  )
);