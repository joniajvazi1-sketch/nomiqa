import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Biometric Authentication Types
 * Note: The @aparajita/capacitor-biometric-auth package was removed.
 * This hook provides a safe stub that does nothing until the package is re-added.
 */
export type BiometryType = 'faceId' | 'touchId' | 'fingerprintAuthentication' | 'faceAuthentication' | 'irisAuthentication' | 'none';

interface BiometricCredentials {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const BIOMETRIC_CREDENTIALS_KEY = 'nomiqa_biometric_credentials';

/**
 * Biometric Authentication hook (STUB)
 * 
 * The native biometric auth package was removed from dependencies.
 * This stub safely returns disabled state until the package is re-added.
 * 
 * To re-enable biometric auth:
 * 1. Run: npm install @aparajita/capacitor-biometric-auth
 * 2. Restore the dynamic import logic in this file
 */
export const useBiometricAuth = () => {
  const isNative = Capacitor.isNativePlatform();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user previously enabled biometric login
  const hasStoredCredentials = typeof window !== 'undefined' && 
    localStorage.getItem(BIOMETRIC_CREDENTIALS_KEY) !== null;

  /**
   * Enable biometric login - DISABLED (package removed)
   */
  const enableBiometric = useCallback(async (
    _email: string,
    _accessToken: string,
    _refreshToken: string,
    _expiresAt: number
  ): Promise<boolean> => {
    console.warn('[BiometricAuth] Package not installed - biometric auth disabled');
    return false;
  }, []);

  /**
   * Authenticate with biometrics - DISABLED (package removed)
   */
  const authenticate = useCallback(async (): Promise<BiometricCredentials | null> => {
    console.warn('[BiometricAuth] Package not installed - biometric auth disabled');
    return null;
  }, []);

  /**
   * Disable biometric login
   */
  const disableBiometric = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
    console.log('[BiometricAuth] Disabled');
  }, []);

  /**
   * Update stored tokens (no-op since package removed)
   */
  const updateCredentials = useCallback((
    _accessToken: string,
    _refreshToken: string,
    _expiresAt: number
  ) => {
    // No-op - package removed
  }, []);

  /**
   * Get display name for the biometry type
   */
  const getBiometryName = useCallback((): string => {
    return 'Biometric';
  }, []);

  return {
    // Always report unavailable since package is removed
    isAvailable: false,
    isEnabled: false,
    isLoading,
    biometryType: 'none' as BiometryType,
    getBiometryName,
    enableBiometric,
    authenticate,
    disableBiometric,
    updateCredentials,
  };
};
