import { useQuery } from '@tanstack/react-query';
import { storefrontApiRequest, PRODUCTS_QUERY, ShopifyProduct } from '@/lib/shopify';

export const useShopifyProducts = (first = 50, searchQuery?: string) => {
  return useQuery({
    queryKey: ['shopify-products', first, searchQuery],
    queryFn: async () => {
      const variables: Record<string, unknown> = { first };
      if (searchQuery?.trim()) {
        variables.query = searchQuery.trim();
      }

      const data = await storefrontApiRequest(PRODUCTS_QUERY, variables);
      if (!data?.data?.products?.edges) return { products: [] as ShopifyProduct[], hasNextPage: false, endCursor: null };

      return {
        products: data.data.products.edges as ShopifyProduct[],
        hasNextPage: data.data.products.pageInfo.hasNextPage,
        endCursor: data.data.products.pageInfo.endCursor,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};
