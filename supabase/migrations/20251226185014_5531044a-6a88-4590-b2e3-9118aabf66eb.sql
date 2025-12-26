-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to sync products every hour
SELECT cron.schedule(
  'sync-airlo-products-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://gzhmbiopiciugriatsdb.supabase.co/functions/v1/airlo-products',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aG1iaW9waWNpdWdyaWF0c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTIyOTksImV4cCI6MjA3ODAyODI5OX0.AJWpvzFixGJqAthZq1SRV-_WAIHfSMJe_o90YomCKgI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);