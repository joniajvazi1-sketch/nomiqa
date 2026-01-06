import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

/**
 * Speed Test Endpoints Edge Function
 * 
 * Provides stable, reliable endpoints for:
 * - Latency testing (HEAD/GET tiny response)
 * - Download testing (configurable size 100KB - 5MB)
 * - Upload testing (accepts POST body)
 * 
 * Usage:
 * - GET /speed-test-endpoints?type=latency → 1-byte response for ping
 * - GET /speed-test-endpoints?type=download&bytes=1000000 → 1MB download
 * - POST /speed-test-endpoints?type=upload → accepts body, returns timing
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const testType = url.searchParams.get('type') || 'latency';
  const startTime = Date.now();

  try {
    switch (testType) {
      case 'latency':
        // Return minimal response for accurate latency measurement
        return new Response('1', {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain',
            'Content-Length': '1',
            'X-Server-Time': startTime.toString(),
          }
        });

      case 'download':
        // Generate download payload of specified size
        const bytes = Math.min(
          Math.max(parseInt(url.searchParams.get('bytes') || '100000'), 1000),
          5000000 // Max 5MB
        );
        
        // Generate random bytes for realistic download test
        const downloadData = new Uint8Array(bytes);
        crypto.getRandomValues(downloadData);
        
        return new Response(downloadData, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/octet-stream',
            'Content-Length': bytes.toString(),
            'X-Server-Time': startTime.toString(),
            'X-Requested-Bytes': bytes.toString(),
          }
        });

      case 'upload':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'POST required for upload test' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Read the uploaded body
        const body = await req.arrayBuffer();
        const receivedBytes = body.byteLength;
        const processingTime = Date.now() - startTime;
        
        return new Response(JSON.stringify({
          success: true,
          received_bytes: receivedBytes,
          processing_time_ms: processingTime,
          server_time: startTime
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ 
          error: 'Unknown test type. Use: latency, download, or upload',
          available_types: ['latency', 'download', 'upload']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Speed test endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
