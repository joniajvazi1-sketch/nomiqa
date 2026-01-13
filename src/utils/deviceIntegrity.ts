import { Capacitor } from '@capacitor/core';

/**
 * Device Integrity Signals for Anti-Fraud
 * 
 * Collects basic device integrity indicators that help detect:
 * - Jailbroken/rooted devices
 * - Emulators/simulators
 * - VPN/proxy usage (optional)
 * - Mock location spoofing
 */

interface DeviceIntegrityResult {
  isEmulator: boolean;
  isJailbroken: boolean;
  isVpnDetected: boolean;
  isMockLocation: boolean;
  integrityScore: number; // 0-100, higher = more trusted
  flags: string[];
}

/**
 * Check if running in an emulator (Android) or simulator (iOS)
 */
const detectEmulator = (): { isEmulator: boolean; flags: string[] } => {
  const flags: string[] = [];
  
  if (!Capacitor.isNativePlatform()) {
    return { isEmulator: false, flags: ['platform:web'] };
  }

  const ua = navigator.userAgent.toLowerCase();
  
  // Common emulator indicators
  if (ua.includes('sdk') || ua.includes('emulator') || ua.includes('simulator')) {
    flags.push('ua:emulator_string');
  }
  
  // Check screen dimensions (emulators often have unusual sizes)
  const { width, height } = window.screen;
  if (width === 0 || height === 0) {
    flags.push('screen:zero_dimensions');
  }
  
  // Check for Android emulator-specific properties
  if (Capacitor.getPlatform() === 'android') {
    // Check for goldfish (Android emulator) in user agent
    if (ua.includes('goldfish') || ua.includes('ranchu')) {
      flags.push('ua:android_emulator');
    }
    
    // Check device memory (emulators often report low/zero)
    const nav = navigator as any;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 1) {
      flags.push('memory:low');
    }
  }
  
  // Check for iOS simulator indicators
  if (Capacitor.getPlatform() === 'ios') {
    // Simulators don't have certain hardware features
    if (!('ontouchstart' in window)) {
      flags.push('touch:missing');
    }
  }
  
  const isEmulator = flags.some(f => 
    f.includes('emulator') || 
    f.includes('simulator') ||
    f.includes('goldfish') ||
    f.includes('ranchu')
  );
  
  return { isEmulator, flags };
};

/**
 * Check for jailbreak/root indicators
 * Note: This is basic detection - determined attackers can bypass
 */
const detectJailbreak = (): { isJailbroken: boolean; flags: string[] } => {
  const flags: string[] = [];
  
  if (!Capacitor.isNativePlatform()) {
    return { isJailbroken: false, flags: [] };
  }
  
  // Check for Cydia URL scheme (iOS jailbreak)
  if (Capacitor.getPlatform() === 'ios') {
    // This is a heuristic - can't directly check on iOS from JS
    // Real detection would need native plugin
    flags.push('ios:native_check_needed');
  }
  
  // Android root indicators
  if (Capacitor.getPlatform() === 'android') {
    // Check for common rooted device indicators in user agent
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('magisk') || ua.includes('supersu') || ua.includes('superuser')) {
      flags.push('ua:root_app');
    }
    
    // Check for unusual device names
    const nav = navigator as any;
    if (nav.platform && nav.platform.toLowerCase().includes('root')) {
      flags.push('platform:root');
    }
  }
  
  const isJailbroken = flags.some(f => 
    f.includes('root') || 
    f.includes('jailbreak')
  );
  
  return { isJailbroken, flags };
};

/**
 * Check for VPN/proxy usage
 * Note: This is best-effort detection via timing analysis
 */
const detectVpn = async (): Promise<{ isVpnDetected: boolean; flags: string[] }> => {
  const flags: string[] = [];
  
  // VPN detection is limited from JS
  // Real detection would need:
  // 1. Server-side IP geolocation vs device location
  // 2. WebRTC leak detection
  // 3. DNS leak detection
  
  // Check for WebRTC leaks (indicates VPN might be in use)
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    await pc.createOffer().then(offer => pc.setLocalDescription(offer));
    
    // Wait for ICE candidates
    await new Promise<void>(resolve => {
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          resolve();
        }
      };
      setTimeout(resolve, 500);
    });
    
    pc.close();
    // If we get here without error, WebRTC is available
    // VPN detection would compare public IP from WebRTC vs API call
    flags.push('webrtc:available');
  } catch (error) {
    flags.push('webrtc:blocked');
  }
  
  // Note: Actual VPN detection requires server-side IP analysis
  // This is a placeholder for future implementation
  
  return { isVpnDetected: false, flags };
};

/**
 * Compute overall device integrity score
 */
const computeIntegrityScore = (
  isEmulator: boolean,
  isJailbroken: boolean,
  isVpnDetected: boolean,
  isMockLocation: boolean
): number => {
  let score = 100;
  
  if (isEmulator) score -= 50;
  if (isJailbroken) score -= 30;
  if (isVpnDetected) score -= 10;
  if (isMockLocation) score -= 40;
  
  // Web platform penalty (can't verify as well)
  if (!Capacitor.isNativePlatform()) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Run all device integrity checks
 */
export const checkDeviceIntegrity = async (isMockLocation: boolean = false): Promise<DeviceIntegrityResult> => {
  const emulatorResult = detectEmulator();
  const jailbreakResult = detectJailbreak();
  const vpnResult = await detectVpn();
  
  const integrityScore = computeIntegrityScore(
    emulatorResult.isEmulator,
    jailbreakResult.isJailbroken,
    vpnResult.isVpnDetected,
    isMockLocation
  );
  
  const allFlags = [
    ...emulatorResult.flags,
    ...jailbreakResult.flags,
    ...vpnResult.flags,
  ];
  
  if (isMockLocation) {
    allFlags.push('location:mock');
  }
  
  return {
    isEmulator: emulatorResult.isEmulator,
    isJailbroken: jailbreakResult.isJailbroken,
    isVpnDetected: vpnResult.isVpnDetected,
    isMockLocation,
    integrityScore,
    flags: allFlags,
  };
};

/**
 * Get a simple device trust level
 */
export const getDeviceTrustLevel = (integrity: DeviceIntegrityResult): 'high' | 'medium' | 'low' | 'untrusted' => {
  if (integrity.integrityScore >= 80) return 'high';
  if (integrity.integrityScore >= 60) return 'medium';
  if (integrity.integrityScore >= 40) return 'low';
  return 'untrusted';
};

export type { DeviceIntegrityResult };
