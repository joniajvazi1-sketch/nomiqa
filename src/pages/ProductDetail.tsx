import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, ShopifyProduct } from "@/lib/shopify";
import { useShopifyCart } from "@/stores/shopifyCartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { SEO } from "@/components/SEO";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const addItem = useShopifyCart(state => state.addItem);
  const isCartLoading = useShopifyCart(state => state.isLoading);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['shopify-product', handle],
    queryFn: async () => {
      const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
      if (!data?.data?.productByHandle) throw new Error('Product not found');
      return { node: data.data.productByHandle } as ShopifyProduct;
    },
    enabled: !!handle,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/60 text-lg">Product not found</p>
          <Button onClick={() => navigate('/shop')} variant="outline" className="border-neon-cyan text-neon-cyan">
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const images = product.node.images.edges;
  const variants = product.node.variants.edges;
  const selectedVariant = variants[selectedVariantIdx]?.node;
  const price = selectedVariant?.price || product.node.priceRange.minVariantPrice;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success(`${product.node.title} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <SEO page="shop" />
      <NetworkBackground />
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <Button variant="ghost" className="mb-6 text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate('/shop')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {images.length > 0 && (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={images[selectedImage]?.node.url}
                  alt={images[selectedImage]?.node.altText || product.node.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === idx ? 'border-neon-cyan' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white mb-2">{product.node.title}</h1>
              <div className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
                {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
              </div>
            </div>

            {/* Variant selection */}
            {product.node.options.map((option) => {
              if (option.name === 'Title' && option.values.length === 1 && option.values[0] === 'Default Title') return null;
              return (
                <div key={option.name}>
                  <label className="text-sm font-medium text-white/70 mb-2 block">{option.name}</label>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((val) => {
                      const variantIdx = variants.findIndex(v =>
                        v.node.selectedOptions.some(o => o.name === option.name && o.value === val)
                      );
                      const isSelected = selectedVariantIdx === variantIdx;
                      const variant = variants[variantIdx]?.node;
                      return (
                        <Button
                          key={val}
                          variant="outline"
                          size="sm"
                          disabled={variant && !variant.availableForSale}
                          onClick={() => setSelectedVariantIdx(variantIdx >= 0 ? variantIdx : 0)}
                          className={`rounded-full px-4 transition-all ${
                            isSelected
                              ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                              : 'bg-white/[0.02] border-white/10 text-white/60 hover:border-white/30'
                          }`}
                        >
                          {val}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {selectedVariant && !selectedVariant.availableForSale && (
              <Badge variant="outline" className="border-red-500/30 text-red-400">Sold Out</Badge>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={isCartLoading || !selectedVariant?.availableForSale}
              className="w-full bg-neon-cyan/20 border-2 border-neon-cyan/40 text-white hover:bg-neon-cyan/30 hover:border-neon-cyan/60 font-light h-14 rounded-xl text-lg transition-colors duration-200"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'}
            </Button>

            {product.node.description && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-sm font-medium text-white/70 mb-2">Description</h3>
                <p className="text-white/60 font-light leading-relaxed">{product.node.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
