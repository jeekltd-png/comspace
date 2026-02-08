import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// SSR-safe localStorage helpers
const getStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
};
const setStorage = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch { /* skip */ }
};
const removeStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch { /* skip */ }
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accountType?: 'individual' | 'business' | 'association';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: getStorage('token'),
  refreshToken: getStorage('refreshToken'),
  isAuthenticated: !!getStorage('token'),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      setStorage('token', action.payload.token);
      setStorage('refreshToken', action.payload.refreshToken);
    },
    logout: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      removeStorage('token');
      removeStorage('refreshToken');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
