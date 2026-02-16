import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CurrencyState {
  current: string;
  rates: Record<string, number>;
  symbol: string;
  autoDetected: boolean;
}

const initialState: CurrencyState = {
  current: 'USD',
  rates: {},
  symbol: '$',
  autoDetected: false,
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
  KRW: '₩',
  BRL: 'R$',
  MXN: 'MX$',
  ZAR: 'R',
  NGN: '₦',
  GHS: 'GH₵',
  KES: 'KSh',
  AED: 'د.إ',
  SAR: '﷼',
  TRY: '₺',
  RUB: '₽',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  CHF: 'CHF',
  PLN: 'zł',
  THB: '฿',
  VND: '₫',
  IDR: 'Rp',
  MYR: 'RM',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  PHP: '₱',
  EGP: 'E£',
  PKR: '₨',
  BDT: '৳',
  COP: 'COL$',
  ARS: 'AR$',
  CLP: 'CLP$',
  PEN: 'S/',
  NZD: 'NZ$',
};

/** Map country code → default currency */
const countryCurrencyMap: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD',
  CN: 'CNY', JP: 'JPY', KR: 'KRW', IN: 'INR', PK: 'PKR', BD: 'BDT',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN',
  ZA: 'ZAR', NG: 'NGN', GH: 'GHS', KE: 'KES', EG: 'EGP',
  AE: 'AED', SA: 'SAR', TR: 'TRY', RU: 'RUB',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF', PL: 'PLN',
  TH: 'THB', VN: 'VND', ID: 'IDR', MY: 'MYR', SG: 'SGD',
  HK: 'HKD', TW: 'TWD', PH: 'PHP',
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      state.current = action.payload;
      state.symbol = currencySymbols[action.payload] || action.payload + ' ';
    },
    setRates: (state, action: PayloadAction<Record<string, number>>) => {
      state.rates = action.payload;
    },
    /** Auto-detect currency from user's country code (e.g. from timezone or IP) */
    detectCurrencyFromCountry: (state, action: PayloadAction<string>) => {
      const countryCode = action.payload.toUpperCase();
      const detectedCurrency = countryCurrencyMap[countryCode];
      if (detectedCurrency && !state.autoDetected) {
        state.current = detectedCurrency;
        state.symbol = currencySymbols[detectedCurrency] || detectedCurrency + ' ';
        state.autoDetected = true;
      }
    },
  },
});

export const { setCurrency, setRates, detectCurrencyFromCountry } = currencySlice.actions;
export default currencySlice.reducer;

