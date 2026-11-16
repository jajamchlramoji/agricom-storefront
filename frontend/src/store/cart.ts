import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canOrder, maxQuantity, type CartItem } from '../data/products';
import { useCatalog } from './catalog';

type CartState = {
  items: CartItem[];
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};
const orderable = (productId: string) =>
  canOrder(useCatalog.getState().products.find((product) => product.id === productId));
/** Cart persists in this browser on this device. It does not sync orders across devices. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (productId, quantity = 1) =>
        set((state) => {
          if (!orderable(productId)) return state;
          const found = state.items.find((item) => item.productId === productId);
          return {
            items: found
              ? state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: Math.min(maxQuantity, item.quantity + quantity) }
                    : item,
                )
              : [...state.items, { productId, quantity: Math.min(maxQuantity, quantity) }],
          };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId ? { ...item, quantity: Math.min(maxQuantity, quantity) } : item,
                ),
        })),
      remove: (productId) => set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'agricom-cart-v1' },
  ),
);
