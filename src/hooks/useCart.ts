import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './useProducts';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },
      
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.product.id !== productId) });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
        } else {
          set({
            items: get().items.map(item =>
              item.product.id === productId
                ? { ...item, quantity }
                : item
            )
          });
        }
      },
      
      clearCart: () => set({ items: [] }),
      
      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.product.price_usd * item.quantity,
          0
        );
      }
    }),
    {
      name: 'esim-cart',
    }
  )
);