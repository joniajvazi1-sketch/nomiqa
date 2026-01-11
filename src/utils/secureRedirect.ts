/**
 * Validates and sanitizes redirect URLs to prevent open redirect attacks.
 * Only allows relative paths starting with '/' and rejects:
 * - External URLs (http://, https://, //)
 * - JavaScript protocol attacks (javascript:)
 * - Data URLs (data:)
 * - Any other protocol schemes
 * 
 * @param url - The redirect URL to validate
 * @param fallback - The fallback URL if validation fails (default: '/')
 * @returns A safe redirect URL
 */
export const validateRedirectUrl = (url: string | null, fallback: string = '/'): string => {
  // If no URL provided, return fallback
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  // Must start with a single forward slash (relative path)
  if (!trimmedUrl.startsWith('/')) {
    return fallback;
  }

  // Reject protocol-relative URLs (//example.com)
  if (trimmedUrl.startsWith('//')) {
    return fallback;
  }

  // Check for dangerous protocols (case-insensitive)
  const lowerUrl = trimmedUrl.toLowerCase();
  const dangerousPatterns = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'blob:',
  ];

  for (const pattern of dangerousPatterns) {
    if (lowerUrl.includes(pattern)) {
      return fallback;
    }
  }

  // Check for encoded dangerous characters that could bypass validation
  // Decode and check again
  try {
    const decodedUrl = decodeURIComponent(trimmedUrl);
    const lowerDecoded = decodedUrl.toLowerCase();
    
    for (const pattern of dangerousPatterns) {
      if (lowerDecoded.includes(pattern)) {
        return fallback;
      }
    }
    
    // Also reject if decoded URL doesn't start with /
    if (!decodedUrl.startsWith('/') || decodedUrl.startsWith('//')) {
      return fallback;
    }
  } catch {
    // If decoding fails, reject the URL as potentially malicious
    return fallback;
  }

  // Additional check: reject URLs with @ which could be used for credential injection
  if (trimmedUrl.includes('@')) {
    return fallback;
  }

  // Validate that the path doesn't contain newlines or carriage returns (header injection)
  if (/[\r\n]/.test(trimmedUrl)) {
    return fallback;
  }

  return trimmedUrl;
};

/**
 * Encodes a redirect URL for safe use in query parameters
 * @param path - The path to encode
 * @returns The encoded URL
 */
export const encodeRedirectUrl = (path: string): string => {
  const safePath = validateRedirectUrl(path);
  return encodeURIComponent(safePath);
};
