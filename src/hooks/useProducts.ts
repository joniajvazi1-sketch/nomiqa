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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('price_usd', { ascending: true })
        .order('is_popular', { ascending: false });

      if (error) throw error;
      
      // Filter out packages with SMS or Voice (keep data-only)
      const filteredData = (data as Product[]).filter(product => {
        const name = product.name.toLowerCase();
        return !name.includes('sms') && !name.includes('mins');
      });
      
      return filteredData;
    },
  });
};

// Optimized hook for featured products - fetches both local and regional packages
export const useFeaturedProducts = (localCountryCodes: string[], regionalCodes: string[]) => {
  return useQuery({
    queryKey: ['featured-products', localCountryCodes, regionalCodes],
    queryFn: async () => {
      const products: Product[] = [];
      
      // Fetch cheapest local product for each country
      for (const countryCode of localCountryCodes) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('country_code', countryCode)
          .eq('package_type', 'local')
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
      
      // Fetch cheapest regional product for each region
      for (const regionCode of regionalCodes) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('country_code', regionCode)
          .eq('package_type', 'regional')
          .order('price_usd', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error(`Error fetching regional product for ${regionCode}:`, error);
          continue;
        }
        
        if (data) {
          products.push(data as Product);
        }
      }
      
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
