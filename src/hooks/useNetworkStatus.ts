import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { usePlatform } from './usePlatform';

/**
 * Network status hook for detecting online/offline state
 * Used for offline queue management in Network Contribution feature
 */
export const useNetworkStatus = () => {
  const { isNative } = usePlatform();
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: true,
    connectionType: 'wifi'
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (isNative) {
          const networkStatus = await Network.getStatus();
          setStatus(networkStatus);
        } else {
          setStatus({
            connected: navigator.onLine,
            connectionType: 'wifi'
          });
        }
      } catch (error) {
        console.warn('Network status check failed:', error);
      }
    };

    checkStatus();

    // Set up listener
    let handler: any;
    if (isNative) {
      handler = Network.addListener('networkStatusChange', (newStatus) => {
        setStatus(newStatus);
      });
    } else {
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
