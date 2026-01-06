import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * Speed Test Endpoints Edge Function
 * 
 * Provides stable, reliable endpoints for:
 * - Latency testing (HEAD/GET tiny response) - primary use
 * - Download testing (fallback only - prefer static storage files)
 * - Upload testing (accepts POST body)
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'latency';

  console.log(`[SpeedTest] Request type: ${type}, method: ${req.method}`);

  try {
    // Latency test - minimal response for HEAD/GET
    if (type === 'latency') {
      return new Response('ok', {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Content-Length': '2',
          'X-Speed-Test': 'latency',
          'X-Timestamp': Date.now().toString(),
        },
      });
    }

    // Upload test - accept POST data and measure
    if (type === 'upload') {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POST required for upload test' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.arrayBuffer();
      const bytesReceived = body.byteLength;
      
      console.log(`[SpeedTest] Upload received: ${bytesReceived} bytes`);

      return new Response(JSON.stringify({ 
        success: true,
        bytesReceived,
        timestamp: Date.now()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download test - fallback (prefer static storage files for accuracy)
    if (type === 'download') {
      const bytes = parseInt(url.searchParams.get('bytes') || '1000000', 10);
      const safeBytes = Math.min(Math.max(bytes, 1000), 5000000); // 1KB to 5MB
      
      console.log(`[SpeedTest] Generating download: ${safeBytes} bytes (fallback mode)`);
      
      // Generate random data to prevent compression
      const data = new Uint8Array(safeBytes);
      crypto.getRandomValues(data);

      return new Response(data, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/octet-stream',
          'Content-Length': safeBytes.toString(),
          'X-Speed-Test': 'download-fallback',
          'X-Bytes': safeBytes.toString(),
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid test type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SpeedTest] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
