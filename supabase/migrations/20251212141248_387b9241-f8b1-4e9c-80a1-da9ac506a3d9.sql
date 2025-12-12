-- Fix critical RLS security issues: require proper authentication instead of email matching

-- Drop existing policies on orders table
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow order creation" ON public.orders;

-- Create stricter policies for orders - require auth.uid() for viewing
CREATE POLICY "Authenticated users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Order creation requires either authenticated user or guest checkout with email
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL AND email IS NOT NULL)
);

-- Drop existing policies on affiliates table
DROP POLICY IF EXISTS "Users can view their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Users can create their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update their own affiliate account" ON public.affiliates;

-- Create stricter policies for affiliates - require auth.uid()
CREATE POLICY "Authenticated users can view their own affiliate account" 
ON public.affiliates 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Authenticated users can create their own affiliate account" 
ON public.affiliates 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Authenticated users can update their own affiliate account" 
ON public.affiliates 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Fix esim_usage policy to require authentication
DROP POLICY IF EXISTS "Users can view their own esim usage" ON public.esim_usage;

CREATE POLICY "Authenticated users can view their own esim usage" 
ON public.esim_usage 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = esim_usage.order_id 
    AND (
      orders.user_id = auth.uid() 
      OR (orders.user_id IS NULL AND orders.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  )
);