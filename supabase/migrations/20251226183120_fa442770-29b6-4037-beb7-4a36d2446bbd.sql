
-- Recreate the trigger (it may have been lost in the revert)
DROP TRIGGER IF EXISTS sync_order_pii_trigger ON public.orders;

CREATE TRIGGER sync_order_pii_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_pii();
