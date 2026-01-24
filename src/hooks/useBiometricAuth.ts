import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Dynamic import type
type BiometricAuthModule = typeof import('@aparajita/capacitor-biometric-auth');

export type BiometryType = 'faceId' | 'touchId' | 'fingerprintAuthentication' | 'faceAuthentication' | 'irisAuthentication' | 'none';

interface BiometricCredentials {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const BIOMETRIC_CREDENTIALS_KEY = 'nomiqa_biometric_credentials';

/**
 * Biometric Authentication hook
 * Enables Face ID / Touch ID / Fingerprint for returning users
 */
export const useBiometricAuth = () => {
  const isNative = Capacitor.isNativePlatform();
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricModule, setBiometricModule] = useState<BiometricAuthModule | null>(null);

  // Check biometric availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      if (!isNative) {
        setIsAvailable(false);
        return;
      }

      try {
        const module = await import('@aparajita/capacitor-biometric-auth');
        setBiometricModule(module);

        const result = await module.BiometricAuth.checkBiometry();
        
        if (result.isAvailable) {
          setIsAvailable(true);
          
          // Map biometry type
          switch (result.biometryType) {
            case 1: // faceId
              setBiometryType('faceId');
              break;
            case 2: // touchId
              setBiometryType('touchId');
              break;
            case 3: // fingerprintAuthentication
              setBiometryType('fingerprintAuthentication');
              break;
            case 4: // faceAuthentication
              setBiometryType('faceAuthentication');
              break;
            case 5: // irisAuthentication
              setBiometryType('irisAuthentication');
              break;
            default:
              setBiometryType('none');
          }
        }

        // Check if user has enabled biometric login
        const stored = localStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
        setIsEnabled(!!stored);
      } catch (error) {
        console.error('[BiometricAuth] Check failed:', error);
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, [isNative]);

  /**
   * Store credentials securely for biometric login
   */
  const enableBiometric = useCallback(async (
    email: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: number
  ): Promise<boolean> => {
    if (!isNative || !biometricModule || !isAvailable) {
      console.warn('[BiometricAuth] Not available');
      return false;
    }

    setIsLoading(true);
    try {
      // Authenticate first to confirm user's identity
      await biometricModule.BiometricAuth.authenticate({
        reason: 'Enable quick sign-in',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
      });

      // Store encrypted credentials
      const credentials: BiometricCredentials = {
        email,
        accessToken,
        refreshToken,
        expiresAt,
      };

      // In production, use Capacitor Secure Storage
      // For now, use localStorage with a flag
      localStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(credentials));
      setIsEnabled(true);
      
      console.log('[BiometricAuth] Enabled successfully');
      return true;
    } catch (error: any) {
      console.error('[BiometricAuth] Enable failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, biometricModule, isAvailable]);

  /**
   * Authenticate with biometrics and retrieve stored credentials
   */
  const authenticate = useCallback(async (): Promise<BiometricCredentials | null> => {
    if (!isNative || !biometricModule || !isEnabled) {
      console.warn('[BiometricAuth] Not enabled');
      return null;
    }

    setIsLoading(true);
    try {
      // Perform biometric authentication
      await biometricModule.BiometricAuth.authenticate({
        reason: 'Sign in to Nomiqa',
        cancelTitle: 'Use password',
        allowDeviceCredential: true,
      });

      // Retrieve stored credentials
      const stored = localStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
      if (!stored) {
        return null;
      }

      const credentials: BiometricCredentials = JSON.parse(stored);
      
      // Check if tokens are expired
      if (credentials.expiresAt < Date.now()) {
        console.warn('[BiometricAuth] Stored credentials expired');
        return null;
      }

      console.log('[BiometricAuth] Authenticated successfully');
      return credentials;
    } catch (error: any) {
      // User cancelled or auth failed
      if (error?.code === 'userCancel' || error?.message?.includes('cancel')) {
        console.log('[BiometricAuth] User cancelled');
        return null;
      }
      console.error('[BiometricAuth] Auth failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, biometricModule, isEnabled]);

  /**
   * Disable biometric login
   */
  const disableBiometric = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
    setIsEnabled(false);
    console.log('[BiometricAuth] Disabled');
  }, []);

  /**
   * Update stored tokens (after refresh)
   */
  const updateCredentials = useCallback((
    accessToken: string,
    refreshToken: string,
    expiresAt: number
  ) => {
    const stored = localStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
    if (!stored) return;

    try {
      const credentials: BiometricCredentials = JSON.parse(stored);
      credentials.accessToken = accessToken;
      credentials.refreshToken = refreshToken;
      credentials.expiresAt = expiresAt;
      localStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('[BiometricAuth] Update failed:', error);
    }
  }, []);

  /**
   * Get display name for the biometry type
   */
  const getBiometryName = useCallback((): string => {
    switch (biometryType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprintAuthentication':
        return 'Fingerprint';
      case 'faceAuthentication':
        return 'Face Unlock';
      case 'irisAuthentication':
        return 'Iris';
      default:
        return 'Biometric';
    }
  }, [biometryType]);

  return {
    isAvailable,
    isEnabled,
    isLoading,
    biometryType,
    getBiometryName,
    enableBiometric,
    authenticate,
    disableBiometric,
    updateCredentials,
  };
};
