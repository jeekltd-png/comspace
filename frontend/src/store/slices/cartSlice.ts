import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CartItem } from '@/types';

// SSR-safe localStorage helpers
const getCartFromStorage = (): { items: CartItem[]; total: number } => {
  if (typeof window === 'undefined') return { items: [], total: 0 };
  try {
    const stored = localStorage.getItem('comspace_cart');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        items: parsed.items || [],
        total: (parsed.items || []).reduce(
          (sum: number, item: CartItem) => sum + item.price * item.quantity, 0
        ),
      };
    }
  } catch { /* corrupted data, ignore */ }
  return { items: [], total: 0 };
};

const persistCart = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('comspace_cart', JSON.stringify({ items }));
  } catch { /* storage full, ignore */ }
};

const computeTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

interface CartState {
  items: CartItem[];
  total: number;
}

const stored = getCartFromStorage();
const initialState: CartState = {
  items: stored.items,
  total: stored.total,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        item =>
          item.productId === action.payload.productId &&
          item.variant === action.payload.variant
      );

      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      state.total = computeTotal(state.items);
      persistCart(state.items);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        state.total = computeTotal(state.items);
        persistCart(state.items);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = computeTotal(state.items);
      persistCart(state.items);
    },
    clearCart: state => {
      state.items = [];
      state.total = 0;
      persistCart([]);
    },
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.total = computeTotal(action.payload);
      persistCart(action.payload);
    },
  },
});

export const { addItem, updateQuantity, removeItem, clearCart, setCart } = cartSlice.actions;
export default cartSlice.reducer;
