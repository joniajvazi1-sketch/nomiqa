-- Create user_spending table to track total spending
CREATE TABLE IF NOT EXISTS public.user_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_spent_usd NUMERIC NOT NULL DEFAULT 0,
  membership_tier TEXT NOT NULL DEFAULT 'bronze',
  cashback_rate NUMERIC NOT NULL DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_spending ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own spending"
  ON public.user_spending FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending"
  ON public.user_spending FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update membership tier based on spending
CREATE OR REPLACE FUNCTION public.update_membership_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tier and cashback rate based on total spent
  IF NEW.total_spent_usd >= 150 THEN
    NEW.membership_tier := 'platinum';
    NEW.cashback_rate := 10.00;
  ELSIF NEW.total_spent_usd >= 50 THEN
    NEW.membership_tier := 'gold';
    NEW.cashback_rate := 7.00;
  ELSIF NEW.total_spent_usd >= 20 THEN
    NEW.membership_tier := 'silver';
    NEW.cashback_rate := 6.00;
  ELSE
    NEW.membership_tier := 'bronze';
    NEW.cashback_rate := 5.00;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_membership_tier_trigger
  BEFORE INSERT OR UPDATE OF total_spent_usd ON public.user_spending
  FOR EACH ROW
  EXECUTE FUNCTION public.update_membership_tier();