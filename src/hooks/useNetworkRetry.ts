import { useState, useCallback, useRef } from 'react';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * Hook for network requests with exponential backoff retry logic
 */
export const useNetworkRetry = <T>(config?: RetryConfig) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateDelay = useCallback((attempt: number) => {
    const delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, finalConfig.maxDelay);
  }, [finalConfig.baseDelay, finalConfig.backoffFactor, finalConfig.maxDelay]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const executeWithRetry = useCallback(async <R>(
    fn: (signal?: AbortSignal) => Promise<R>,
    onRetryAttempt?: (attempt: number, error: Error) => void
  ): Promise<R> => {
    // Cancel any pending request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        setState(prev => ({
          ...prev,
          isRetrying: attempt > 0,
          retryCount: attempt,
        }));

        const result = await fn(abortControllerRef.current.signal);
        
        setState({
          isRetrying: false,
          retryCount: 0,
          lastError: null,
        });
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on abort
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }

        // Don't retry on client errors (4xx)
        if (error instanceof Response && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt < finalConfig.maxRetries) {
          const delay = calculateDelay(attempt);
          onRetryAttempt?.(attempt + 1, lastError);
          console.log(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`);
          await sleep(delay);
        }
      }
    }

    setState(prev => ({
      ...prev,
      isRetrying: false,
      lastError,
    }));

    throw lastError;
  }, [finalConfig.maxRetries, calculateDelay]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  return {
    executeWithRetry,
    cancel,
    ...state,
  };
};

/**
 * Wrapper for fetch with automatic retry
 */
export const fetchWithRetry = async (
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> => {
  const config = { ...DEFAULT_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options?.signal || AbortSignal.timeout(15000),
      });

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
        const jitter = Math.random() * 0.3 * delay;
        await new Promise(resolve => setTimeout(resolve, Math.min(delay + jitter, config.maxDelay)));
      }
    }
  }

  throw lastError;
};
