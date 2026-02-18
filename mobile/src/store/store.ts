import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Simple mobile store - independent from web frontend
// Each platform has its own store to avoid module resolution issues

interface MobileState {
  auth: {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
  };
  cart: {
    items: any[];
    total: number;
  };
}

const initialAuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const initialCartState = {
  items: [],
  total: 0,
};

// Auth slice
const authReducer = (state = initialAuthState, action: any) => {
  switch (action.type) {
    case 'auth/setCredentials':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
      };
    case 'auth/logout':
      return initialAuthState;
    default:
      return state;
  }
};

// Cart slice
const cartReducer = (state = initialCartState, action: any) => {
  switch (action.type) {
    case 'cart/addItem': {
      const existingIndex = state.items.findIndex(
        (item: any) => item.id === action.payload.id
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1,
        };
        return {
          ...state,
          items: newItems,
          total: newItems.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
          ),
        };
      }
      const newItems = [...state.items, { ...action.payload, quantity: 1 }];
      return {
        ...state,
        items: newItems,
        total: newItems.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        ),
      };
    }
    case 'cart/removeItem':
      const filtered = state.items.filter(
        (item: any) => item.id !== action.payload
      );
      return {
        ...state,
        items: filtered,
        total: filtered.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        ),
      };
    case 'cart/clear':
      return initialCartState;
    default:
      return state;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Action creators
export const setCredentials = (payload: { token: string; user: any }) => ({
  type: 'auth/setCredentials' as const,
  payload,
});

export const logoutAction = () => ({ type: 'auth/logout' as const });

export const addToCart = (item: any) => ({
  type: 'cart/addItem' as const,
  payload: item,
});

export const removeFromCart = (id: string) => ({
  type: 'cart/removeItem' as const,
  payload: id,
});

export const clearCart = () => ({ type: 'cart/clear' as const });
