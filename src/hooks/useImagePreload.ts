import { useEffect, useRef, useCallback, useState } from 'react';

interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto';
  lazy?: boolean;
}

interface PreloadStatus {
  loaded: Set<string>;
  failed: Set<string>;
  pending: Set<string>;
}

/**
 * Hook for preloading images to improve perceived performance
 */
export const useImagePreload = () => {
  const statusRef = useRef<PreloadStatus>({
    loaded: new Set(),
    failed: new Set(),
    pending: new Set(),
  });
  const [loadedCount, setLoadedCount] = useState(0);

  const preloadImage = useCallback((
    src: string,
    options: PreloadOptions = {}
  ): Promise<void> => {
    const { priority = 'auto', lazy = false } = options;

    // Skip if already loaded or pending
    if (statusRef.current.loaded.has(src) || statusRef.current.pending.has(src)) {
      return Promise.resolve();
    }

    statusRef.current.pending.add(src);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set loading priority
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }
      
      if (lazy) {
        (img as any).loading = 'lazy';
      }

      img.onload = () => {
        statusRef.current.pending.delete(src);
        statusRef.current.loaded.add(src);
        setLoadedCount(prev => prev + 1);
        resolve();
      };

      img.onerror = () => {
        statusRef.current.pending.delete(src);
        statusRef.current.failed.add(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (
    sources: string[],
    options: PreloadOptions = {}
  ): Promise<void[]> => {
    const promises = sources.map(src => 
      preloadImage(src, options).catch(() => {
        // Silently fail individual images
      })
    );
    
    return Promise.all(promises) as Promise<void[]>;
  }, [preloadImage]);

  const isLoaded = useCallback((src: string): boolean => {
    return statusRef.current.loaded.has(src);
  }, []);

  const isPending = useCallback((src: string): boolean => {
    return statusRef.current.pending.has(src);
  }, []);

  return {
    preloadImage,
    preloadImages,
    isLoaded,
    isPending,
    loadedCount,
    status: statusRef.current,
  };
};

/**
 * Hook for intersection observer-based image preloading
 * Preloads images as they approach the viewport
 */
export const useIntersectionPreload = (
  sources: string[],
  options: { rootMargin?: string; threshold?: number } = {}
) => {
  const { rootMargin = '200px', threshold = 0 } = options;
  const { preloadImages, isLoaded } = useImagePreload();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (preloadedRef.current || sources.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !preloadedRef.current) {
            preloadedRef.current = true;
            preloadImages(sources, { priority: 'low', lazy: true });
            observerRef.current?.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    if (triggerRef.current) {
      observerRef.current.observe(triggerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sources, preloadImages, rootMargin, threshold]);

  return { triggerRef, isLoaded };
};

/**
 * Preload country flag images for shop products
 */
export const preloadCountryFlags = async (countryCodes: string[]) => {
  const flagUrls = countryCodes.map(code => 
    `https://flagcdn.com/w80/${code.toLowerCase()}.png`
  );
  
  const promises = flagUrls.map(url => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error
      img.src = url;
    });
  });

  return Promise.all(promises);
};

/**
 * Component wrapper for blur-up image loading effect
 */
export const useBlurUpImage = (src: string, placeholderSrc?: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return {
    src: currentSrc,
    isLoaded,
    style: {
      filter: isLoaded ? 'none' : 'blur(10px)',
      transition: 'filter 0.3s ease-out',
    },
  };
};
