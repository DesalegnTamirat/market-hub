import { create } from 'zustand';
import { Cart, AddToCartData } from '@/types';
import { api, handleApiError } from '@/lib/api';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (data: AddToCartData) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get<Cart>('/cart');
      set({ cart: data, isLoading: false });
    } catch (error) {
      const message = handleApiError(error);
      set({ error: message, isLoading: false });
    }
  },

  addToCart: async (addData: AddToCartData) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post<Cart>('/cart/items', addData);
      set({ cart: data, isLoading: false });
    } catch (error) {
      const message = handleApiError(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateQuantity: async (productId: string, quantity: number) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.patch<Cart>(`/cart/items/${productId}`, {
        quantity,
      });
      set({ cart: data, isLoading: false });
    } catch (error) {
      const message = handleApiError(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeFromCart: async (productId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.delete<Cart>(`/cart/items/${productId}`);
      set({ cart: data, isLoading: false });
    } catch (error) {
      const message = handleApiError(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearCart: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.delete('/cart');
      set({ cart: data, isLoading: false });
    } catch (error) {
      const message = handleApiError(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
