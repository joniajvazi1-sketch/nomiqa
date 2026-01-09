import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

// Type-only imports
type NetworkModule = typeof import('@capacitor/network');
type ConnectionStatus = import('@capacitor/network').ConnectionStatus;

/**
 * Network status hook for detecting online/offline state
 * Used for offline queue management in Network Contribution feature
 * Uses dynamic imports to avoid bundling Capacitor network on web
 */
export const useNetworkStatus = () => {
  const isNative = Capacitor.isNativePlatform();
  const networkRef = useRef<NetworkModule | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: true,
    connectionType: 'wifi'
  });

  useEffect(() => {
    let handler: { remove: () => void } | null = null;

    const init = async () => {
      try {
        if (isNative) {
          // Dynamically load Network module
          if (!networkRef.current) {
            networkRef.current = await import('@capacitor/network');
          }
          const { Network } = networkRef.current;
          
          const networkStatus = await Network.getStatus();
          setStatus(networkStatus);
          
          // Set up listener
          handler = await Network.addListener('networkStatusChange', (newStatus) => {
            setStatus(newStatus);
          });
        } else {
          setStatus({
            connected: navigator.onLine,
            connectionType: 'wifi'
          });
          
          const onOnline = () => setStatus({ connected: true, connectionType: 'wifi' });
          const onOffline = () => setStatus({ connected: false, connectionType: 'none' });
          window.addEventListener('online', onOnline);
          window.addEventListener('offline', onOffline);
          handler = {
            remove: () => {
              window.removeEventListener('online', onOnline);
              window.removeEventListener('offline', onOffline);
            }
          };
        }
      } catch (error) {
        console.warn('Network status init failed:', error);
      }
    };

    init();

    return () => {
      if (handler?.remove) handler.remove();
    };
  }, [isNative]);

  return {
    isOnline: status.connected,
    isOffline: !status.connected,
    connectionType: status.connectionType
  };
};
