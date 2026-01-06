-- Create a public storage bucket for speed test files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('speed-test-files', 'speed-test-files', true, 10485760, ARRAY['application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to speed test files
CREATE POLICY "Public read access for speed test files"
ON storage.objects FOR SELECT
USING (bucket_id = 'speed-test-files');

-- Only service role can upload/manage
CREATE POLICY "Service role can manage speed test files"
ON storage.objects FOR ALL
USING (bucket_id = 'speed-test-files' AND auth.role() = 'service_role');