/**
 * Speed Test Provider Configuration
 * 
 * Strategy:
 * - Latency: Use Edge Function (fast, minimal overhead)
 * - Download: Use static files from Storage/CDN (realistic carrier speed)
 * - Upload: Use Edge Function (acceptable overhead)
 * 
 * File sizes:
 * - 1MB: 2G/3G networks
 * - 3MB: 4G/LTE networks (default)
 * - 5MB: 5G networks
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface SpeedTestEndpoints {
  latencyUrl: string;
  downloadUrls: { size: number; url: string }[];
  uploadUrl: string;
  provider: string;
}

export interface SpeedTestResult {
  down: number | null;
  up: number | null;
  latency: number | null;
  provider: string;
  latencyMethod: string;
  downloadSize?: number;
  downloadError?: string;
  uploadError?: string;
  latencyError?: string;
}

export type SpeedTestProgressCallback = (phase: 'latency' | 'download' | 'upload', progress: number) => void;

// Download file sizes in bytes - larger files for more accurate results
const DOWNLOAD_SIZES = {
  small: 3_000_000,   // 3MB - for 2G/3G
  medium: 10_000_000, // 10MB - for 4G/LTE (default)
  large: 25_000_000,  // 25MB - for 5G
};

// Primary endpoints (Nomiqa's own)
// Latency uses edge function, download uses static storage files
const NOMIQA_ENDPOINTS: SpeedTestEndpoints = {
  latencyUrl: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=latency`,
  downloadUrls: [
    { size: DOWNLOAD_SIZES.small, url: `${SUPABASE_URL}/storage/v1/object/public/speed-test-files/1mb.bin` },
    { size: DOWNLOAD_SIZES.medium, url: `${SUPABASE_URL}/storage/v1/object/public/speed-test-files/3mb.bin` },
    { size: DOWNLOAD_SIZES.large, url: `${SUPABASE_URL}/storage/v1/object/public/speed-test-files/5mb.bin` },
  ],
  uploadUrl: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=upload`,
  provider: 'nomiqa'
};

// Fallback: Edge function for download (less accurate but works)
const NOMIQA_FALLBACK_ENDPOINTS: SpeedTestEndpoints = {
  latencyUrl: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=latency`,
  downloadUrls: [
    { size: DOWNLOAD_SIZES.small, url: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=download&bytes=${DOWNLOAD_SIZES.small}` },
    { size: DOWNLOAD_SIZES.medium, url: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=download&bytes=${DOWNLOAD_SIZES.medium}` },
    { size: DOWNLOAD_SIZES.large, url: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=download&bytes=${DOWNLOAD_SIZES.large}` },
  ],
  uploadUrl: `${SUPABASE_URL}/functions/v1/speed-test-endpoints?type=upload`,
  provider: 'nomiqa-fallback'
};

// Cloudflare fallback
const CLOUDFLARE_ENDPOINTS: SpeedTestEndpoints = {
  latencyUrl: 'https://www.cloudflare.com/cdn-cgi/trace',
  downloadUrls: [
    { size: DOWNLOAD_SIZES.small, url: 'https://speed.cloudflare.com/__down?bytes=1000000' },
    { size: DOWNLOAD_SIZES.medium, url: 'https://speed.cloudflare.com/__down?bytes=3000000' },
    { size: DOWNLOAD_SIZES.large, url: 'https://speed.cloudflare.com/__down?bytes=5000000' },
  ],
  uploadUrl: 'https://speed.cloudflare.com/__up',
  provider: 'cloudflare'
};

// Export providers list for diagnostic display
export const SPEED_TEST_PROVIDERS = [NOMIQA_ENDPOINTS, CLOUDFLARE_ENDPOINTS];

/**
 * Select appropriate download size based on network type
 */
function selectDownloadSize(networkType?: string): number {
  if (!networkType) return DOWNLOAD_SIZES.medium;
  
  const lower = networkType.toLowerCase();
  
  // 5G gets large file
  if (lower.includes('5g') || lower.includes('nr')) {
    return DOWNLOAD_SIZES.large;
  }
  
  // 4G/LTE gets medium file
  if (lower.includes('4g') || lower.includes('lte')) {
    return DOWNLOAD_SIZES.medium;
  }
  
  // 2G/3G gets small file
  if (lower.includes('2g') || lower.includes('3g') || lower.includes('edge') || lower.includes('hspa')) {
    return DOWNLOAD_SIZES.small;
  }
  
  return DOWNLOAD_SIZES.medium;
}

/**
 * Add cache buster to URL
 */
function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}&r=${Math.random().toString(36).slice(2)}`;
}

/**
 * Test if an endpoint is reachable
 */
async function isEndpointReachable(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(addCacheBuster(url), {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 405;
  } catch {
    return false;
  }
}

/**
 * Check if static storage files are available
 */
async function areStaticFilesAvailable(): Promise<boolean> {
  try {
    // Test with a HEAD request to the 1MB file
    const response = await fetch(addCacheBuster(NOMIQA_ENDPOINTS.downloadUrls[0].url), {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available speed test endpoints with fallback
 */
export async function getAvailableEndpoints(): Promise<SpeedTestEndpoints> {
  // Check if static storage files are available (preferred)
  const staticAvailable = await areStaticFilesAvailable();
  
  if (staticAvailable) {
    console.log('[SpeedTest] Using Nomiqa static storage files');
    return NOMIQA_ENDPOINTS;
  }
  
  // Try edge function latency endpoint
  const latencyReachable = await isEndpointReachable(NOMIQA_FALLBACK_ENDPOINTS.latencyUrl);
  
  if (latencyReachable) {
    console.log('[SpeedTest] Static files unavailable, using Nomiqa edge function fallback');
    return NOMIQA_FALLBACK_ENDPOINTS;
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
      const testUrl = addCacheBuster(url);
      const start = performance.now();
      const response = await fetch(testUrl, {
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
        const testUrl = addCacheBuster(url);
        const start = performance.now();
        await fetch(testUrl, { method: 'GET', cache: 'no-store' });
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
 * Measure download speed with appropriate file size and progress tracking
 */
async function measureDownload(
  downloadUrls: { size: number; url: string }[],
  networkType?: string,
  onProgress?: (progress: number) => void
): Promise<{ down: number | null; size: number; error?: string }> {
  const targetSize = selectDownloadSize(networkType);
  
  // Find the closest size available
  const sortedUrls = [...downloadUrls].sort((a, b) => 
    Math.abs(a.size - targetSize) - Math.abs(b.size - targetSize)
  );
  
  const selectedUrl = sortedUrls[0];
  console.log(`[SpeedTest] Selected ${(selectedUrl.size / 1_000_000).toFixed(1)}MB file for ${networkType || 'unknown'} network`);
  
  try {
    const testUrl = addCacheBuster(selectedUrl.url);
    const start = performance.now();
    const response = await fetch(testUrl, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Use streaming to track progress
    const contentLength = response.headers.get('Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : selectedUrl.size;
    
    if (response.body && onProgress) {
      const reader = response.body.getReader();
      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedBytes += value.length;
        
        // Report progress (0-100)
        const progress = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
        onProgress(progress);
      }
      
      const elapsed = (performance.now() - start) / 1000; // seconds
      const bits = receivedBytes * 8;
      const mbps = (bits / 1_000_000) / elapsed;
      
      console.log(`[SpeedTest] Download: ${receivedBytes} bytes in ${elapsed.toFixed(2)}s = ${mbps.toFixed(1)} Mbps`);
      
      return { down: Math.round(mbps * 10) / 10, size: receivedBytes };
    } else {
      // Fallback without progress
      const buffer = await response.arrayBuffer();
      const elapsed = (performance.now() - start) / 1000;
      const bits = buffer.byteLength * 8;
      const mbps = (bits / 1_000_000) / elapsed;
      
      console.log(`[SpeedTest] Download: ${buffer.byteLength} bytes in ${elapsed.toFixed(2)}s = ${mbps.toFixed(1)} Mbps`);
      
      return { down: Math.round(mbps * 10) / 10, size: buffer.byteLength };
    }
  } catch (error) {
    return { 
      down: null,
      size: selectedUrl.size,
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
    const testUrl = addCacheBuster(url);
    
    const start = performance.now();
    const response = await fetch(testUrl, {
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
 * Run complete speed test with fallback providers and progress tracking
 */
export async function runSpeedTest(
  includeUpload = true, 
  networkType?: string,
  onProgress?: SpeedTestProgressCallback
): Promise<SpeedTestResult> {
  // Get available endpoints (with fallback)
  const endpoints = await getAvailableEndpoints();
  
  // Run latency first (quick)
  onProgress?.('latency', 0);
  const latencyResult = await measureLatency(endpoints.latencyUrl);
  onProgress?.('latency', 100);
  
  // Download with progress
  onProgress?.('download', 0);
  const downloadResult = await measureDownload(
    endpoints.downloadUrls, 
    networkType,
    (progress) => onProgress?.('download', progress)
  );
  
  // Upload test (optional, can be skipped to save battery)
  let uploadResult: { up: number | null; error?: string } = { up: null };
  if (includeUpload) {
    onProgress?.('upload', 0);
    uploadResult = await measureUpload(endpoints.uploadUrl);
    onProgress?.('upload', 100);
  }
  
  const result: SpeedTestResult = {
    down: downloadResult.down,
    up: uploadResult.up,
    latency: latencyResult.latency,
    provider: endpoints.provider,
    latencyMethod: latencyResult.method,
    downloadSize: downloadResult.size,
    downloadError: downloadResult.error,
    uploadError: uploadResult.error,
    latencyError: latencyResult.error
  };
  
  // If primary provider failed completely, try Cloudflare
  if (endpoints.provider !== 'cloudflare' && 
      result.latency === null && 
      result.down === null) {
    console.log('[SpeedTest] Primary tests failed, trying Cloudflare fallback');
    
    const fallbackEndpoints = CLOUDFLARE_ENDPOINTS;
    
    onProgress?.('latency', 0);
    const fallbackLatency = await measureLatency(fallbackEndpoints.latencyUrl);
    onProgress?.('latency', 100);
    
    onProgress?.('download', 0);
    const fallbackDownload = await measureDownload(
      fallbackEndpoints.downloadUrls, 
      networkType,
      (progress) => onProgress?.('download', progress)
    );
    
    result.latency = fallbackLatency.latency;
    result.down = fallbackDownload.down;
    result.provider = 'cloudflare';
    result.latencyMethod = fallbackLatency.method;
    result.latencyError = fallbackLatency.error;
    result.downloadError = fallbackDownload.error;
    result.downloadSize = fallbackDownload.size;
    
    if (includeUpload) {
      onProgress?.('upload', 0);
      const fallbackUpload = await measureUpload(fallbackEndpoints.uploadUrl);
      result.up = fallbackUpload.up;
      result.uploadError = fallbackUpload.error;
      onProgress?.('upload', 100);
    }
  }
  
  console.log('[SpeedTest] Result:', {
    provider: result.provider,
    latency: result.latency,
    down: result.down,
    up: result.up,
    downloadSize: result.downloadSize,
    errors: { latency: result.latencyError, download: result.downloadError, upload: result.uploadError }
  });
  
  return result;
}
