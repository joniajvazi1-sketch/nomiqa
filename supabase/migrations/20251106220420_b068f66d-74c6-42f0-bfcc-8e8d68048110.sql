-- Add eSIM details to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS iccid text,
ADD COLUMN IF NOT EXISTS lpa text,
ADD COLUMN IF NOT EXISTS matching_id text,
ADD COLUMN IF NOT EXISTS qrcode text,
ADD COLUMN IF NOT EXISTS airlo_request_id text,
ADD COLUMN IF NOT EXISTS manual_installation text,
ADD COLUMN IF NOT EXISTS qrcode_installation text,
ADD COLUMN IF NOT EXISTS package_name text,
ADD COLUMN IF NOT EXISTS data_amount text,
ADD COLUMN IF NOT EXISTS validity_days integer;

-- Create webhook_logs table for tracking webhook events
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  signature text,
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create esim_usage table to track data usage
CREATE TABLE IF NOT EXISTS esim_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  iccid text NOT NULL UNIQUE,
  remaining_mb integer,
  total_mb integer,
  remaining_voice integer DEFAULT 0,
  remaining_text integer DEFAULT 0,
  status text DEFAULT 'NOT_ACTIVE',
  expired_at timestamp with time zone,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on esim_usage
ALTER TABLE esim_usage ENABLE ROW LEVEL SECURITY;

-- Users can view usage for their own eSIMs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'esim_usage' AND policyname = 'Users can view their own esim usage'
  ) THEN
    CREATE POLICY "Users can view their own esim usage"
    ON esim_usage FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = esim_usage.order_id
        AND (orders.user_id = auth.uid() OR orders.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      )
    );
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_orders_airlo_request_id ON orders(airlo_request_id);
CREATE INDEX IF NOT EXISTS idx_esim_usage_iccid ON esim_usage(iccid);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);

-- Update orders RLS to allow inserts for authenticated users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can create their own orders'
  ) THEN
    CREATE POLICY "Users can create their own orders"
    ON orders FOR INSERT
    WITH CHECK (
      auth.uid() = user_id OR 
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;
END $$;