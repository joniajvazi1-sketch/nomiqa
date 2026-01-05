-- Security Fix: Remove PII columns from orders table
-- PII will be stored ONLY in orders_pii table (which has strict RLS blocking all user access)

-- Step 1: Drop all triggers on orders table related to PII sync
DROP TRIGGER IF EXISTS orders_pii_sync_trigger ON public.orders;
DROP TRIGGER IF EXISTS sync_order_pii_trigger ON public.orders;

-- Step 2: Drop the function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS public.sync_order_pii() CASCADE;

-- Step 3: Remove PII columns from orders table
-- Keep email column but make it nullable (will always be 'see-orders-pii@private' or null)
ALTER TABLE public.orders ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN email SET DEFAULT 'see-orders-pii@private';

-- Now drop the actual PII columns
ALTER TABLE public.orders DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.orders DROP COLUMN IF EXISTS iccid;
ALTER TABLE public.orders DROP COLUMN IF EXISTS qrcode;
ALTER TABLE public.orders DROP COLUMN IF EXISTS qr_code_url;
ALTER TABLE public.orders DROP COLUMN IF EXISTS activation_code;
ALTER TABLE public.orders DROP COLUMN IF EXISTS lpa;
ALTER TABLE public.orders DROP COLUMN IF EXISTS matching_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS manual_installation;
ALTER TABLE public.orders DROP COLUMN IF EXISTS qrcode_installation;
ALTER TABLE public.orders DROP COLUMN IF EXISTS sharing_link;
ALTER TABLE public.orders DROP COLUMN IF EXISTS sharing_access_code;

-- Step 4: Update existing orders to use placeholder email
UPDATE public.orders SET email = 'see-orders-pii@private' WHERE email != 'see-orders-pii@private';