-- Add operator information to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS operator_name TEXT,
ADD COLUMN IF NOT EXISTS operator_image_url TEXT,
ADD COLUMN IF NOT EXISTS country_image_url TEXT;