import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CurrencyState {
  current: string;
  rates: Record<string, number>;
  symbol: string;
}

const initialState: CurrencyState = {
  current: 'USD',
  rates: {},
  symbol: '$',
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      state.current = action.payload;
      state.symbol = currencySymbols[action.payload] || action.payload;
    },
    setRates: (state, action: PayloadAction<Record<string, number>>) => {
      state.rates = action.payload;
    },
  },
});

export const { setCurrency, setRates } = currencySlice.actions;
export default currencySlice.reducer;
