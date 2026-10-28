import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { products, type CartItem } from '../data/products';

type CartState = { items: CartItem[]; add: (productId: string) => void; setQuantity: (productId: string, quantity: number) => void; remove: (productId: string) => void; clear: () => void };
/** Cart persists in this browser on this device. It does not sync orders across devices. */
export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  add: (productId) => set((state) => {
    const stock = products.find((product) => product.id === productId)?.stock ?? 0;
    const found = state.items.find((item) => item.productId === productId);
    if (stock < 1 || (found && found.quantity >= stock)) return state;
    return { items: found ? state.items.map((item) => item.productId === productId ? { ...item, quantity: Math.min(stock, item.quantity + 1) } : item) : [...state.items, { productId, quantity: 1 }] };
  }),
  setQuantity: (productId, quantity) => set((state) => {
    const stock = products.find((product) => product.id === productId)?.stock ?? 0;
    return { items: quantity <= 0 ? state.items.filter((item) => item.productId !== productId) : state.items.map((item) => item.productId === productId ? { ...item, quantity: Math.min(stock, quantity) } : item) };
  }),
  remove: (productId) => set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
  clear: () => set({ items: [] }),
}), { name: 'agricom-cart-v1' }));
