-- Add package_type column to distinguish local vs regional/global eSIMs
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_type text DEFAULT 'local';

-- Add coverages column to store coverage info for regional eSIMs (JSON array of country codes)
ALTER TABLE products ADD COLUMN IF NOT EXISTS coverages jsonb DEFAULT NULL;

-- Create index for efficient filtering by package_type
CREATE INDEX IF NOT EXISTS idx_products_package_type ON products(package_type);