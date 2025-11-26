-- Add sharing link and access code columns for Airalo's branded eSIM Cloud portal
ALTER TABLE orders 
ADD COLUMN sharing_link TEXT,
ADD COLUMN sharing_access_code TEXT;