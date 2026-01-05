import { useEffect, useState } from 'react';

interface SolanaPrice {
  usd: number;
  usd_24h_change: number;
}

export const useSolanaPrice = () => {
  const [price, setPrice] = useState<SolanaPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch price');
        }
        
        const data = await response.json();
        setPrice({
          usd: data.solana.usd,
          usd_24h_change: data.solana.usd_24h_change
        });
        setError(null);
      } catch (err) {
        setError('Failed to fetch price');
        console.error('Error fetching Solana price:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Defer fetch to after initial render using requestIdleCallback to avoid blocking LCP
    let intervalId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const startFetching = () => {
      fetchPrice();
      // Refresh every 60 seconds
      intervalId = setInterval(fetchPrice, 60000);
    };
    
    // Use requestIdleCallback for truly non-blocking defer, fallback to setTimeout
    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(startFetching, { timeout: 5000 });
      return () => {
        (window as any).cancelIdleCallback(idleId);
        if (intervalId) clearInterval(intervalId);
      };
    } else {
      timeoutId = setTimeout(startFetching, 3000);
      return () => {
        clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, []);

  return { price, isLoading, error };
};
