import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
}

function loadFromStorage(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('comspace_wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(items: WishlistItem[]) {
  try {
    localStorage.setItem('comspace_wishlist', JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

const initialState: WishlistState = {
  items: loadFromStorage(),
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const exists = state.items.some(i => i.productId === action.payload.productId);
      if (!exists) {
        state.items.push(action.payload);
        persist(state.items);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.productId !== action.payload);
      persist(state.items);
    },
    toggleWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const idx = state.items.findIndex(i => i.productId === action.payload.productId);
      if (idx >= 0) {
        state.items.splice(idx, 1);
      } else {
        state.items.push(action.payload);
      }
      persist(state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      persist(state.items);
    },
    /** Rehydrate from localStorage on client mount */
    hydrateWishlist: (state) => {
      state.items = loadFromStorage();
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
  hydrateWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
