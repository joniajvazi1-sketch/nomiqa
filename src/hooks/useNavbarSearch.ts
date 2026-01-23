import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAllTranslatedNames, getTranslatedCountryName } from "@/utils/countryTranslations";
import { Language } from "@/contexts/TranslationContext";

interface SearchableProduct {
  country_code: string;
  country_name: string;
  package_type: string;
}

interface SearchResult {
  code: string;
  name: string;
  score: number;
  isRegional: boolean;
}

// Lightweight hook for navbar search - only fetches minimal data
export const useNavbarSearch = (language: Language) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Only fetch when user starts searching - and only fetch minimal fields
  const { data: searchableProducts } = useQuery({
    queryKey: ['navbar-search-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('country_code, country_name, package_type');
      
      if (error) throw error;
      
      // Deduplicate by country_code + package_type
      const unique = new Map<string, SearchableProduct>();
      for (const product of data || []) {
        const key = `${product.country_code}-${product.package_type}`;
        if (!unique.has(key)) {
          unique.set(key, product);
        }
      }
      
      return Array.from(unique.values());
    },
    // Only enable when there's a search query
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes - this data rarely changes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });

  // Fuzzy search helper
  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    if (s2.includes(s1) || s1.includes(s2)) return 0.8;
    
    let matches = 0;
    const maxLength = Math.max(s1.length, s2.length);
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    return matches / maxLength;
  }, []);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !searchableProducts || searchQuery.length < 2) return [];
    
    const searchLower = searchQuery.toLowerCase();
    const resultMap = new Map<string, SearchResult>();
    
    searchableProducts.forEach(product => {
      const isRegional = product.package_type === 'regional';
      const allNames = getAllTranslatedNames(product.country_code);
      const currentName = isRegional ? product.country_name : getTranslatedCountryName(product.country_code, language);
      
      const scores = [
        calculateSimilarity(searchLower, currentName.toLowerCase()),
        calculateSimilarity(searchLower, product.country_name.toLowerCase()),
        ...allNames.map(name => calculateSimilarity(searchLower, name.toLowerCase())),
      ];
      
      const maxScore = Math.max(...scores);
      
      // Only include results with reasonable similarity
      if (maxScore < 0.3) return;
      
      const key = `${product.country_code}-${isRegional ? 'regional' : 'local'}`;
      const existing = resultMap.get(key);
      if (!existing || maxScore > existing.score) {
        resultMap.set(key, {
          code: product.country_code,
          name: currentName,
          score: maxScore,
          isRegional,
        });
      }
    });
    
    return Array.from(resultMap.values())
      .filter(r => r.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [searchQuery, searchableProducts, language, calculateSimilarity]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
  };
};
