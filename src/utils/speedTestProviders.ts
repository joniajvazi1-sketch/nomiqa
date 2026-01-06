/**
 * Speed Test Provider Configuration
 * 
 * Primary: Nomiqa's own edge function endpoints
 * Fallback: Cloudflare (reliable global CDN)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface SpeedTestEndpoints {
  latencyUrl: string;
  downloadUrl: string;
  uploadUrl: string;
  provider: string;
}

export interface SpeedTestResult {
  down: number | null;
  up: number | null;
  latency: number | null;
  provider: string;
  latencyMethod: string;
  downloadError?: string;
  uploadError?: string;
  latencyError?: string;
}

// Primary endpoints (Nomiqa's own)
const NOMIQA_ENDPOINTS: SpeedTestEndpoints = {
  latencyUrl: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=latency`,
  downloadUrl: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=download&bytes=500000`, // 500KB
  uploadUrl: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=upload`,
  provider: 'nomiqa'
};

// Fallback endpoints (Cloudflare)
const CLOUDFLARE_ENDPOINTS: SpeedTestEndpoints = {
  latencyUrl: 'https://www.cloudflare.com/cdn-cgi/trace',
  downloadUrl: 'https://speed.cloudflare.com/__down?bytes=500000',
  uploadUrl: 'https://speed.cloudflare.com/__up',
  provider: 'cloudflare'
};

// Export providers list for diagnostic display
export const SPEED_TEST_PROVIDERS = [NOMIQA_ENDPOINTS, CLOUDFLARE_ENDPOINTS];

/**
 * Test if an endpoint is reachable
 */
async function isEndpointReachable(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 405; // 405 is OK for POST-only endpoints
  } catch {
    return false;
  }
}

/**
 * Get available speed test endpoints with fallback
 */
export async function getAvailableEndpoints(): Promise<SpeedTestEndpoints> {
  // Try Nomiqa endpoints first
  const nomiqaReachable = await isEndpointReachable(NOMIQA_ENDPOINTS.latencyUrl);
  
  if (nomiqaReachable) {
    console.log('[SpeedTest] Using Nomiqa endpoints');
    return NOMIQA_ENDPOINTS;
  }
  
  // Fallback to Cloudflare
  console.log('[SpeedTest] Nomiqa unreachable, using Cloudflare fallback');
  return CLOUDFLARE_ENDPOINTS;
}

/**
 * Measure latency with multiple attempts
 */
async function measureLatency(url: string, attempts = 3): Promise<{ latency: number | null; method: string; error?: string }> {
  const latencies: number[] = [];
  let lastError: string | undefined;
  
  for (let i = 0; i < attempts; i++) {
    try {
      const start = performance.now();
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store'
      });
      
      if (!response.ok && response.status !== 405) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const latency = Math.round(performance.now() - start);
      latencies.push(latency);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // Try GET as fallback for HEAD-restricted endpoints
      try {
        const start = performance.now();
        await fetch(url, { method: 'GET', cache: 'no-store' });
        const latency = Math.round(performance.now() - start);
        latencies.push(latency);
      } catch (getError) {
        lastError = getError instanceof Error ? getError.message : 'Unknown error';
      }
    }
  }
  
  if (latencies.length === 0) {
    return { latency: null, method: 'HEAD', error: lastError };
  }
  
  // Return median latency
  latencies.sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length / 2)];
  
  return { latency: median, method: 'HEAD' };
}

/**
 * Measure download speed
 */
async function measureDownload(url: string): Promise<{ down: number | null; error?: string }> {
  try {
    const start = performance.now();
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const elapsed = (performance.now() - start) / 1000; // seconds
    
    // Calculate Mbps
    const bits = buffer.byteLength * 8;
    const mbps = (bits / 1_000_000) / elapsed;
    
    return { down: Math.round(mbps * 10) / 10 };
  } catch (error) {
    return { 
      down: null, 
      error: error instanceof Error ? error.message : 'Download failed' 
    };
  }
}

/**
 * Measure upload speed
 */
async function measureUpload(url: string, bytes = 100000): Promise<{ up: number | null; error?: string }> {
  try {
    const uploadData = new ArrayBuffer(bytes);
    
    const start = performance.now();
    const response = await fetch(url, {
      method: 'POST',
      body: uploadData,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const elapsed = (performance.now() - start) / 1000; // seconds
    
    // Calculate Mbps
    const bits = bytes * 8;
    const mbps = (bits / 1_000_000) / elapsed;
    
    return { up: Math.round(mbps * 10) / 10 };
  } catch (error) {
    return { 
      up: null, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Run complete speed test with fallback providers
 */
export async function runSpeedTest(includeUpload = true): Promise<SpeedTestResult> {
  // Get available endpoints (with fallback)
  const endpoints = await getAvailableEndpoints();
  
  // Run tests in parallel where possible
  const [latencyResult, downloadResult] = await Promise.all([
    measureLatency(endpoints.latencyUrl),
    measureDownload(endpoints.downloadUrl)
  ]);
  
  // Upload test (optional, can be skipped to save battery)
  let uploadResult: { up: number | null; error?: string } = { up: null };
  if (includeUpload) {
    uploadResult = await measureUpload(endpoints.uploadUrl);
  }
  
  const result: SpeedTestResult = {
    down: downloadResult.down,
    up: uploadResult.up,
    latency: latencyResult.latency,
    provider: endpoints.provider,
    latencyMethod: latencyResult.method,
    downloadError: downloadResult.error,
    uploadError: uploadResult.error,
    latencyError: latencyResult.error
  };
  
  // If primary provider failed, try fallback
  if (endpoints.provider === 'nomiqa' && 
      result.latency === null && 
      result.down === null) {
    console.log('[SpeedTest] Nomiqa tests failed, trying Cloudflare fallback');
    
    const fallbackEndpoints = CLOUDFLARE_ENDPOINTS;
    const [fallbackLatency, fallbackDownload] = await Promise.all([
      measureLatency(fallbackEndpoints.latencyUrl),
      measureDownload(fallbackEndpoints.downloadUrl)
    ]);
    
    result.latency = fallbackLatency.latency;
    result.down = fallbackDownload.down;
    result.provider = 'cloudflare';
    result.latencyMethod = fallbackLatency.method;
    result.latencyError = fallbackLatency.error;
    result.downloadError = fallbackDownload.error;
    
    if (includeUpload) {
      const fallbackUpload = await measureUpload(fallbackEndpoints.uploadUrl);
      result.up = fallbackUpload.up;
      result.uploadError = fallbackUpload.error;
    }
  }
  
  console.log('[SpeedTest] Result:', {
    provider: result.provider,
    latency: result.latency,
    down: result.down,
    up: result.up,
    errors: { latency: result.latencyError, download: result.downloadError, upload: result.uploadError }
  });
  
  return result;
}
