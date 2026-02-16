/**
 * Shared currency formatting utilities.
 *
 * Instead of copy-pasting `formatPrice` into every page/component,
 * import `useFormatPrice()` (client components) or call `formatPrice()`
 * directly when you already have the currency state.
 */

import { useAppSelector } from '@/store/hooks';
import { useCallback } from 'react';

export interface CurrencyInfo {
  current: string;
  rates: Record<string, number>;
  symbol: string;
}

/**
 * Pure function: convert a price from base currency (USD) to the target
 * currency and format it with the correct symbol.
 *
 * @param price  - Price in base currency (USD)
 * @param currency - Currency state from Redux store
 * @returns Formatted string, e.g. "€42.99" or "£35.50"
 */
export function formatPrice(price: number, currency: CurrencyInfo): string {
  const rate = currency.rates[currency.current] || 1;
  const converted = price * rate;

  // Use Intl.NumberFormat for proper locale-aware formatting
  // (respects decimal separators, digit grouping, etc.)
  try {
    return new Intl.NumberFormat(currencyToLocale(currency.current), {
      style: 'currency',
      currency: currency.current,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  } catch {
    // Fallback if Intl doesn't recognise the currency code
    return `${currency.symbol}${converted.toFixed(2)}`;
  }
}

/**
 * React hook that returns a memoised `formatPrice` bound to the current
 * Redux currency state.  Use in client components:
 *
 * ```tsx
 * const fmt = useFormatPrice();
 * return <span>{fmt(product.basePrice)}</span>;
 * ```
 */
export function useFormatPrice(): (price: number) => string {
  const currency = useAppSelector(state => state.currency);

  return useCallback(
    (price: number) => formatPrice(price, currency),
    [currency],
  );
}

/**
 * Map ISO 4217 currency code → representative BCP 47 locale
 * so `Intl.NumberFormat` places the symbol correctly
 * (e.g. "€42,99" in Germany vs "$42.99" in the US).
 */
function currencyToLocale(code: string): string {
  const map: Record<string, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    CAD: 'en-CA',
    AUD: 'en-AU',
    INR: 'en-IN',
    KRW: 'ko-KR',
    BRL: 'pt-BR',
    MXN: 'es-MX',
    ZAR: 'en-ZA',
    NGN: 'en-NG',
    GHS: 'en-GH',
    KES: 'en-KE',
    AED: 'ar-AE',
    SAR: 'ar-SA',
    TRY: 'tr-TR',
    RUB: 'ru-RU',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    CHF: 'de-CH',
    PLN: 'pl-PL',
    THB: 'th-TH',
    VND: 'vi-VN',
    IDR: 'id-ID',
    MYR: 'ms-MY',
    SGD: 'en-SG',
    HKD: 'en-HK',
    TWD: 'zh-TW',
    PHP: 'en-PH',
    EGP: 'ar-EG',
    PKR: 'en-PK',
    BDT: 'bn-BD',
    COP: 'es-CO',
    ARS: 'es-AR',
    CLP: 'es-CL',
    PEN: 'es-PE',
    NZD: 'en-NZ',
  };
  return map[code] || 'en-US';
}
