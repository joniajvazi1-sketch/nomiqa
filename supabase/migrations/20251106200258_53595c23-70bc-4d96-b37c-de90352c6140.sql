-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create products table for eSIM plans
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  airlo_package_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  data_amount TEXT NOT NULL,
  validity_days INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  features JSONB,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  product_id UUID NOT NULL REFERENCES public.products(id),
  airlo_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT NOT NULL,
  qr_code_url TEXT,
  activation_code TEXT,
  total_amount_usd DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Products are viewable by everyone
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Orders can be viewed by the user who created them or by email
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX idx_products_country ON public.products(country_code);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_email ON public.orders(email);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();