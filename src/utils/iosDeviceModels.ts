/**
 * iOS Device Model Identifier to Marketing Name Mapping
 * 
 * Maps raw iOS device identifiers (e.g., "iPhone17,2") to user-friendly
 * marketing names (e.g., "iPhone 16 Pro").
 * 
 * This is a local lookup - no network calls required.
 * Update periodically when new devices are released.
 * 
 * Source: https://www.theiphonewiki.com/wiki/Models
 * Last updated: January 2025
 */

export const iosDeviceModels: Record<string, string> = {
  // iPhone 16 Series (2024)
  'iPhone17,1': 'iPhone 16 Pro',
  'iPhone17,2': 'iPhone 16 Pro Max',
  'iPhone17,3': 'iPhone 16',
  'iPhone17,4': 'iPhone 16 Plus',
  
  // iPhone 15 Series (2023)
  'iPhone15,4': 'iPhone 15',
  'iPhone15,5': 'iPhone 15 Plus',
  'iPhone16,1': 'iPhone 15 Pro',
  'iPhone16,2': 'iPhone 15 Pro Max',
  
  // iPhone 14 Series (2022)
  'iPhone14,7': 'iPhone 14',
  'iPhone14,8': 'iPhone 14 Plus',
  'iPhone15,2': 'iPhone 14 Pro',
  'iPhone15,3': 'iPhone 14 Pro Max',
  
  // iPhone 13 Series (2021)
  'iPhone14,4': 'iPhone 13 mini',
  'iPhone14,5': 'iPhone 13',
  'iPhone14,2': 'iPhone 13 Pro',
  'iPhone14,3': 'iPhone 13 Pro Max',
  
  // iPhone 12 Series (2020)
  'iPhone13,1': 'iPhone 12 mini',
  'iPhone13,2': 'iPhone 12',
  'iPhone13,3': 'iPhone 12 Pro',
  'iPhone13,4': 'iPhone 12 Pro Max',
  
  // iPhone 11 Series (2019)
  'iPhone12,1': 'iPhone 11',
  'iPhone12,3': 'iPhone 11 Pro',
  'iPhone12,5': 'iPhone 11 Pro Max',
  
  // iPhone XS/XR Series (2018)
  'iPhone11,2': 'iPhone XS',
  'iPhone11,4': 'iPhone XS Max',
  'iPhone11,6': 'iPhone XS Max',
  'iPhone11,8': 'iPhone XR',
  
  // iPhone X (2017)
  'iPhone10,3': 'iPhone X',
  'iPhone10,6': 'iPhone X',
  
  // iPhone 8 Series (2017)
  'iPhone10,1': 'iPhone 8',
  'iPhone10,4': 'iPhone 8',
  'iPhone10,2': 'iPhone 8 Plus',
  'iPhone10,5': 'iPhone 8 Plus',
  
  // iPhone SE Series
  'iPhone14,6': 'iPhone SE (3rd gen)',
  'iPhone12,8': 'iPhone SE (2nd gen)',
  'iPhone8,4': 'iPhone SE (1st gen)',
  
  // iPhone 7 Series (2016)
  'iPhone9,1': 'iPhone 7',
  'iPhone9,3': 'iPhone 7',
  'iPhone9,2': 'iPhone 7 Plus',
  'iPhone9,4': 'iPhone 7 Plus',
  
  // iPhone 6s Series (2015)
  'iPhone8,1': 'iPhone 6s',
  'iPhone8,2': 'iPhone 6s Plus',
  
  // iPhone 6 Series (2014)
  'iPhone7,2': 'iPhone 6',
  'iPhone7,1': 'iPhone 6 Plus',
  
  // iPad Pro Series
  'iPad16,3': 'iPad Pro 11-inch (M4)',
  'iPad16,4': 'iPad Pro 11-inch (M4)',
  'iPad16,5': 'iPad Pro 13-inch (M4)',
  'iPad16,6': 'iPad Pro 13-inch (M4)',
  'iPad14,3': 'iPad Pro 11-inch (4th gen)',
  'iPad14,4': 'iPad Pro 11-inch (4th gen)',
  'iPad14,5': 'iPad Pro 12.9-inch (6th gen)',
  'iPad14,6': 'iPad Pro 12.9-inch (6th gen)',
  'iPad13,4': 'iPad Pro 11-inch (3rd gen)',
  'iPad13,5': 'iPad Pro 11-inch (3rd gen)',
  'iPad13,6': 'iPad Pro 11-inch (3rd gen)',
  'iPad13,7': 'iPad Pro 11-inch (3rd gen)',
  'iPad13,8': 'iPad Pro 12.9-inch (5th gen)',
  'iPad13,9': 'iPad Pro 12.9-inch (5th gen)',
  'iPad13,10': 'iPad Pro 12.9-inch (5th gen)',
  'iPad13,11': 'iPad Pro 12.9-inch (5th gen)',
  
  // iPad Air Series
  'iPad14,8': 'iPad Air 11-inch (M2)',
  'iPad14,9': 'iPad Air 11-inch (M2)',
  'iPad14,10': 'iPad Air 13-inch (M2)',
  'iPad14,11': 'iPad Air 13-inch (M2)',
  'iPad13,16': 'iPad Air (5th gen)',
  'iPad13,17': 'iPad Air (5th gen)',
  'iPad13,1': 'iPad Air (4th gen)',
  'iPad13,2': 'iPad Air (4th gen)',
  
  // iPad mini Series
  'iPad14,1': 'iPad mini (6th gen)',
  'iPad14,2': 'iPad mini (6th gen)',
  'iPad11,1': 'iPad mini (5th gen)',
  'iPad11,2': 'iPad mini (5th gen)',
  
  // iPad Series
  'iPad14,12': 'iPad (11th gen)',
  'iPad13,18': 'iPad (10th gen)',
  'iPad13,19': 'iPad (10th gen)',
  'iPad12,1': 'iPad (9th gen)',
  'iPad12,2': 'iPad (9th gen)',
  'iPad11,6': 'iPad (8th gen)',
  'iPad11,7': 'iPad (8th gen)',
  
  // Simulators
  'x86_64': 'Simulator (Intel)',
  'arm64': 'Simulator (Apple Silicon)',
  'i386': 'Simulator (32-bit)',
};

/**
 * Get user-friendly device name from iOS model identifier
 * 
 * @param modelIdentifier Raw iOS identifier (e.g., "iPhone17,2")
 * @returns Marketing name (e.g., "iPhone 16 Pro") or the original identifier if not found
 */
export function getIOSDeviceName(modelIdentifier: string): string {
  return iosDeviceModels[modelIdentifier] || modelIdentifier;
}

/**
 * Get both raw identifier and marketing name
 * Useful for B2B exports where both might be needed
 */
export function getIOSDeviceInfo(modelIdentifier: string): {
  rawIdentifier: string;
  marketingName: string;
  isKnown: boolean;
} {
  const marketingName = iosDeviceModels[modelIdentifier];
  return {
    rawIdentifier: modelIdentifier,
    marketingName: marketingName || modelIdentifier,
    isKnown: !!marketingName,
  };
}
