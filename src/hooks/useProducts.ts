import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  airlo_package_id: string;
  name: string;
  country_code: string;
  country_name: string;
  data_amount: string;
  validity_days: number;
  price_usd: number;
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('price_usd', { ascending: true })
        .order('is_popular', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });
};

// Optimized hook for featured products - only fetches 12 products instead of all
export const useFeaturedProducts = (countryCodes: string[]) => {
  return useQuery({
    queryKey: ['featured-products', countryCodes],
    queryFn: async () => {
      // Fetch cheapest product for each country using a more efficient query
      const products: Product[] = [];
      
      for (const countryCode of countryCodes) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('country_code', countryCode)
          .order('price_usd', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error(`Error fetching product for ${countryCode}:`, error);
          continue;
        }
        
        if (data) {
          products.push(data as Product);
        }
      }
      
      return products;
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