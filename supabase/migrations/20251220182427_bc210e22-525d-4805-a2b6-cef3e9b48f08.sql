-- Create network_registrations table for early network signups
CREATE TABLE public.network_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  referral_code TEXT,
  ip_country TEXT,
  source TEXT DEFAULT 'hero',
  CONSTRAINT network_registrations_email_unique UNIQUE (email)
);

-- Enable Row Level Security
ALTER TABLE public.network_registrations ENABLE ROW LEVEL SECURITY;

-- Only allow inserts (no public read/update/delete)
CREATE POLICY "Anyone can register" 
ON public.network_registrations 
FOR INSERT 
WITH CHECK (true);

-- No public read access
CREATE POLICY "No public read" 
ON public.network_registrations 
FOR SELECT 
USING (false);

-- No public updates
CREATE POLICY "No public updates" 
ON public.network_registrations 
FOR UPDATE 
USING (false);

-- No public deletes
CREATE POLICY "No public deletes" 
ON public.network_registrations 
FOR DELETE 
USING (false);

-- Add index on email for faster lookups
CREATE INDEX idx_network_registrations_email ON public.network_registrations(email);

-- Add index on created_at for analytics
CREATE INDEX idx_network_registrations_created_at ON public.network_registrations(created_at);