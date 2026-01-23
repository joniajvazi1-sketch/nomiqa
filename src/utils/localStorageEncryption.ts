/**
 * localStorage encryption utilities using Web Crypto API
 * Provides AES-GCM encryption for sensitive data stored in localStorage
 */

// Derive encryption key from user session (or fallback to device-specific key)
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  
  // Use a combination of origin and a stable identifier
  // This ensures the key is unique per-origin but stable across sessions
  const keyMaterial = `nomiqa-local-storage-key-${window.location.origin}`;
  
  // Import the raw key material
  const rawKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyMaterial),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the actual encryption key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('nomiqa-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data before storing
export const encryptData = async (data: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );
    
    // Combine IV and encrypted data, then base64 encode
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Encryption] Failed to encrypt data:', error);
    // Fallback to unencrypted for environments without Web Crypto
    return `unencrypted:${data}`;
  }
};

// Decrypt data after retrieving
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    // Handle unencrypted fallback
    if (encryptedData.startsWith('unencrypted:')) {
      return encryptedData.slice(12);
    }
    
    // Handle legacy unencrypted JSON data (starts with [ or {)
    if (encryptedData.startsWith('[') || encryptedData.startsWith('{')) {
      return encryptedData;
    }
    
    const key = await getEncryptionKey();
    const decoder = new TextDecoder();
    
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[Encryption] Failed to decrypt data:', error);
    // If decryption fails, it might be legacy unencrypted data
    // Try to parse it directly
    try {
      JSON.parse(encryptedData);
      return encryptedData; // It's valid JSON, return as-is
    } catch {
      // Not valid JSON either, return empty
      return '[]';
    }
  }
};

// Check if Web Crypto is available
export const isEncryptionSupported = (): boolean => {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function';
};

// Secure localStorage wrapper with encryption
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isEncryptionSupported()) {
      const encrypted = await encryptData(value);
      localStorage.setItem(key, encrypted);
    } else {
      // Fallback for environments without Web Crypto (e.g., old browsers)
      localStorage.setItem(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    if (isEncryptionSupported()) {
      return decryptData(stored);
    }
    return stored;
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};
