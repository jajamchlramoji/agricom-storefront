import { create } from 'zustand';
import { categories, products as sampleProducts, type Product } from '../data/products';
import { apiRequest } from '../services/api';

type CatalogState = {
  products: Product[];
  loading: boolean;
  error: string;
  loadProducts: () => Promise<void>;
  replaceProducts: (products: Product[]) => void;
};

export const useCatalog = create<CatalogState>((set) => ({
  products: sampleProducts,
  loading: false,
  error: '',
  replaceProducts: (products) => set({ products }),
  loadProducts: async () => {
    set({ loading: true, error: '' });
    try {
      const data = await apiRequest<{ products: Product[]; categories?: typeof categories }>('/catalog/products');
      set({ products: data.products, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Could not load the catalog.' });
    }
  },
}));
