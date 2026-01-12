import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

// Type-only imports
type NetworkModule = typeof import('@capacitor/network');
type ConnectionStatus = import('@capacitor/network').ConnectionStatus;

/**
 * Network status hook for detecting online/offline state
 * Includes reconnection toast notifications
 */
export const useNetworkStatus = () => {
  const isNative = Capacitor.isNativePlatform();
  const networkRef = useRef<NetworkModule | null>(null);
  const wasOfflineRef = useRef(false);
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: true,
    connectionType: 'wifi'
  });

  useEffect(() => {
    let handler: { remove: () => void } | null = null;

    const handleStatusChange = (newStatus: ConnectionStatus) => {
      const wasOffline = wasOfflineRef.current;
      const isNowOnline = newStatus.connected;
      
      // Show "Back online!" toast when reconnecting
      if (wasOffline && isNowOnline) {
        toast.success("You're back online!", {
          description: 'Connection restored',
          duration: 3000,
        });
      }
      
      // Show "You're offline" toast when disconnecting
      if (!wasOffline && !isNowOnline) {
        toast.warning("You're offline", {
          description: 'Some features may be limited',
          duration: 4000,
        });
      }
      
      wasOfflineRef.current = !isNowOnline;
      setStatus(newStatus);
    };

    const init = async () => {
      try {
        if (isNative) {
          // Dynamically load Network module
          if (!networkRef.current) {
            networkRef.current = await import('@capacitor/network');
          }
          const { Network } = networkRef.current;
          
          const networkStatus = await Network.getStatus();
          wasOfflineRef.current = !networkStatus.connected;
          setStatus(networkStatus);
          
          // Set up listener
          handler = await Network.addListener('networkStatusChange', handleStatusChange);
        } else {
          const initialOnline = navigator.onLine;
          wasOfflineRef.current = !initialOnline;
          setStatus({
            connected: initialOnline,
            connectionType: 'wifi'
          });
          
          const onOnline = () => handleStatusChange({ connected: true, connectionType: 'wifi' });
          const onOffline = () => handleStatusChange({ connected: false, connectionType: 'none' });
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
