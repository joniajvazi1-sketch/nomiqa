-- Add full_name column to orders table for Airalo eSIM provisioning
ALTER TABLE public.orders ADD COLUMN full_name TEXT;

-- Update existing orders to have a placeholder name (optional, for data consistency)
UPDATE public.orders SET full_name = 'Customer' WHERE full_name IS NULL;