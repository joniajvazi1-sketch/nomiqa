
ALTER TABLE public.orders DROP COLUMN IF EXISTS airlo_order_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS airlo_request_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS airlo_package_id;
