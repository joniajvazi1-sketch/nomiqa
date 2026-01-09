import { useState, useEffect } from 'react';

interface CompatibilityResult {
  isCompatible: boolean | null;
  platform: 'iOS' | 'Android' | 'Unknown';
  deviceModel: string | null;
  isLoading: boolean;
}

export const useDeviceCompatibility = (): CompatibilityResult => {
  const [result, setResult] = useState<CompatibilityResult>({
    isCompatible: null,
    platform: 'Unknown',
    deviceModel: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkCompatibility = () => {
      const userAgent = navigator.userAgent;
      
      // Detect iOS
      const isIOS = /iPhone|iPad|iPod/.test(userAgent);
      
      // Detect Android
      const isAndroid = /Android/.test(userAgent);
      
      // For iOS: iPhone XS and newer support eSIM (basically all iPhones from 2018+)
      // For Android: Most modern Android devices from 2020+ support eSIM
      
      let platform: 'iOS' | 'Android' | 'Unknown' = 'Unknown';
      let deviceModel: string | null = null;
      let isCompatible: boolean | null = null;
      
      if (isIOS) {
        platform = 'iOS';
        // Extract iOS device model from user agent
        const iosMatch = userAgent.match(/iPhone|iPad|iPod/);
        deviceModel = iosMatch ? iosMatch[0] : null;
        
        // Most modern iOS devices support eSIM
        // iPhone XS (2018) and later support eSIM
        isCompatible = true;
      } else if (isAndroid) {
        platform = 'Android';
        // Try to get Android model
        const androidMatch = userAgent.match(/Android\s[\d.]+;\s*([^)]+)/);
        deviceModel = androidMatch ? androidMatch[1].trim() : null;
        
        // Most Android devices from 2020+ with Android 10+ support eSIM
        // We assume compatibility for modern Android devices
        const androidVersionMatch = userAgent.match(/Android\s([\d.]+)/);
        const androidVersion = androidVersionMatch ? parseFloat(androidVersionMatch[1]) : 0;
        
        // Android 10+ (version 10.0+) typically supports eSIM on supported hardware
        isCompatible = androidVersion >= 10;
      } else {
        // Desktop or unknown device - assume compatible (user will scan QR)
        platform = 'Unknown';
        isCompatible = null;
      }
      
      setResult({
        isCompatible,
        platform,
        deviceModel,
        isLoading: false,
      });
    };
    
    // Small delay for UI smoothness
    const timer = setTimeout(checkCompatibility, 100);
    return () => clearTimeout(timer);
  }, []);
  
  return result;
};
