-- Create a security definer function to get current user email
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid();
$$;

-- Drop and recreate affiliates policies with the function
DROP POLICY IF EXISTS "Users can view their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Users can create their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Users can update their own affiliate account" ON public.affiliates;

CREATE POLICY "Users can view their own affiliate account"
ON public.affiliates
FOR SELECT
USING (auth.uid() = user_id OR email = public.get_user_email());

CREATE POLICY "Users can create their own affiliate account"
ON public.affiliates
FOR INSERT
WITH CHECK (auth.uid() = user_id OR email = public.get_user_email());

CREATE POLICY "Users can update their own affiliate account"
ON public.affiliates
FOR UPDATE
USING (auth.uid() = user_id OR email = public.get_user_email());

-- Drop and recreate affiliate_referrals policy
DROP POLICY IF EXISTS "Affiliates can view their own referrals" ON public.affiliate_referrals;

CREATE POLICY "Affiliates can view their own referrals"
ON public.affiliate_referrals
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = affiliate_referrals.affiliate_id 
  AND (affiliates.user_id = auth.uid() OR affiliates.email = public.get_user_email())
));

-- Drop and recreate orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id OR email = public.get_user_email());

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id OR email = public.get_user_email());

-- Drop and recreate esim_usage policy
DROP POLICY IF EXISTS "Users can view their own esim usage" ON public.esim_usage;

CREATE POLICY "Users can view their own esim usage"
ON public.esim_usage
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = esim_usage.order_id
  AND (orders.user_id = auth.uid() OR orders.email = public.get_user_email())
));