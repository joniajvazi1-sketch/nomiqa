-- Create token waitlist table for email captures
CREATE TABLE public.token_waitlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    source TEXT DEFAULT 'token_page',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT token_waitlist_email_unique UNIQUE (email)
);

-- Enable Row Level Security
ALTER TABLE public.token_waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (anyone can join waitlist)
CREATE POLICY "Anyone can join token waitlist" 
ON public.token_waitlist 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view all waitlist entries
CREATE POLICY "Admins can view token waitlist" 
ON public.token_waitlist 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));