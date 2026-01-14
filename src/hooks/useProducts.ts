import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  airlo_package_id: string;
  name: string;
  country_code: string;
  country_name: string;
  country_image_url: string | null;
  operator_name: string | null;
  operator_image_url: string | null;
  data_amount: string;
  validity_days: number;
  price_usd: number;
  package_type: 'local' | 'regional';
  coverages: Array<{ name: string; code: string }> | null;
  features: {
    coverage?: string;
    speed?: string;
    activation?: string;
  };
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Shorter timeout for mobile - 10s is more reasonable for 3G/4G
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('price_usd', { ascending: true })
          .order('is_popular', { ascending: false })
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) throw error;
        
        // Filter out packages with SMS or Voice (keep data-only)
        // Also filter out local packages without country images
        const filteredData = (data as Product[]).filter(product => {
          const name = product.name.toLowerCase();
          const hasNoSmsOrVoice = !name.includes('sms') && !name.includes('mins');
          
          // For local packages, require a country image
          // For regional packages, we use our own region images so no filter needed
          const hasValidImage = product.package_type === 'regional' || 
            (product.country_image_url && product.country_image_url.trim() !== '');
          
          return hasNoSmsOrVoice && hasValidImage;
        });
        
        // Sort: local packages first, then regional, both sorted by price
        return filteredData.sort((a, b) => {
          // Local packages come before regional
          if (a.package_type === 'local' && b.package_type === 'regional') return -1;
          if (a.package_type === 'regional' && b.package_type === 'local') return 1;
          // Within same type, sort by price
          return a.price_usd - b.price_usd;
        });
      } catch (err) {
        clearTimeout(timeoutId);
        // More helpful error for abort
        if (err instanceof Error && err.name === 'AbortError') {
          console.error('Products fetch timed out - slow network');
          throw new Error('Network timeout - please try again');
        }
        console.error('Products fetch error:', err);
        throw err;
      }
    },
    retry: 3, // Increased retries for flaky mobile networks
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (longer for mobile)
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
};

// Optimized hook for featured products - batches queries to reduce network waterfall
export const useFeaturedProducts = (localCountryCodes: string[], regionalCodes: string[]) => {
  return useQuery({
    queryKey: ['featured-products', localCountryCodes, regionalCodes],
    queryFn: async () => {
      // Batch fetch all local products for featured countries in ONE query
      const [localResult, regionalResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .in('country_code', localCountryCodes)
          .eq('package_type', 'local')
          .order('price_usd', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .in('country_code', regionalCodes)
          .eq('package_type', 'regional')
          .order('price_usd', { ascending: true })
      ]);

      if (localResult.error) throw localResult.error;
      if (regionalResult.error) throw regionalResult.error;

      const products: Product[] = [];
      
      // Get cheapest local product per country
      const localByCountry = new Map<string, Product>();
      for (const product of (localResult.data || []) as Product[]) {
        if (!localByCountry.has(product.country_code)) {
          localByCountry.set(product.country_code, product);
        }
      }
      products.push(...localByCountry.values());

      // Get cheapest regional product per region
      const regionalByCode = new Map<string, Product>();
      for (const product of (regionalResult.data || []) as Product[]) {
        if (!regionalByCode.has(product.country_code)) {
          regionalByCode.set(product.country_code, product);
        }
      }
      products.push(...regionalByCode.values());

      // Sort all products by price
      return products.sort((a, b) => a.price_usd - b.price_usd);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useSyncProducts = () => {
  return async () => {
    const { data, error } = await supabase.functions.invoke('airlo-products');
    if (error) throw error;
    return data;
  };
};
