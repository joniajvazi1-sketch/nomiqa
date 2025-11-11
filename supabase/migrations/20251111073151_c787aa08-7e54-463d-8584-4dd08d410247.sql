-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles (will be enforced via service role key)
CREATE POLICY "No user can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No user can update roles"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "No user can delete roles"
ON public.user_roles
FOR DELETE
USING (false);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Add your first admin user (replace with your actual user ID after first signup)
-- You'll need to manually insert your admin user via the backend or SQL editor
-- Example: INSERT INTO public.user_roles (user_id, role) VALUES ('your-user-id-here', 'admin');