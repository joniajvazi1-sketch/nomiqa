-- Create trigger to auto-update updated_at on app_remote_config
CREATE TRIGGER update_app_remote_config_updated_at
  BEFORE UPDATE ON public.app_remote_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();