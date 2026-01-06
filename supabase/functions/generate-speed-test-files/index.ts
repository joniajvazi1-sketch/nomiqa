import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate random bytes in chunks (crypto.getRandomValues has 64KB limit)
 */
function generateRandomBytes(size: number): Uint8Array {
  const data = new Uint8Array(size);
  const chunkSize = 65536; // 64KB chunks
  
  for (let offset = 0; offset < size; offset += chunkSize) {
    const remaining = size - offset;
    const currentChunkSize = Math.min(chunkSize, remaining);
    const chunk = new Uint8Array(currentChunkSize);
    crypto.getRandomValues(chunk);
    data.set(chunk, offset);
  }
  
  return data;
}

/**
 * Generate and upload speed test files to storage
 * Run once to populate the speed-test-files bucket
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const files = [
    { name: '1mb.bin', size: 1_000_000 },
    { name: '3mb.bin', size: 3_000_000 },
    { name: '5mb.bin', size: 5_000_000 },
  ];

  const results: { name: string; success: boolean; error?: string }[] = [];

  for (const file of files) {
    try {
      console.log(`[GenerateFiles] Creating ${file.name} (${file.size} bytes)`);
      
      // Generate random binary data in chunks
      const data = generateRandomBytes(file.size);

      // Upload to storage
      const { error } = await supabase.storage
        .from('speed-test-files')
        .upload(file.name, data, {
          contentType: 'application/octet-stream',
          upsert: true,
          cacheControl: '0'
        });

      if (error) {
        throw error;
      }

      console.log(`[GenerateFiles] Successfully uploaded ${file.name}`);
      results.push({ name: file.name, success: true });
    } catch (error) {
      console.error(`[GenerateFiles] Failed to create ${file.name}:`, error);
      results.push({ 
        name: file.name, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return new Response(JSON.stringify({
    success: results.every(r => r.success),
    files: results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
