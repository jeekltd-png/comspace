/**
 * Multi-currency utilities for server-side price conversion.
 * Uses the same exchange rate cache as the currency controller.
 */

import { redisClient } from '../server';
import axios from 'axios';
import { logger } from './logger';

/** Supported currencies with display info */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

/**
 * Get the exchange rate between two currencies.
 * Checks Redis cache first, then falls back to external API.
 */
export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const cacheKey = `convert:${from}:${to}`;
  try {
    const cached = await redisClient?.get(cacheKey);
    if (cached) return parseFloat(cached);
  } catch (_) { /* Redis unavailable */ }

  try {
    const response = await axios.get(
      `${process.env.CURRENCY_API_URL}/${process.env.CURRENCY_API_KEY}/pair/${from}/${to}`,
      { timeout: 5000 }
    );
    const rate = response.data.conversion_rate;

    try {
      await redisClient?.setEx(cacheKey, 3600, rate.toString());
    } catch (_) { /* ignore */ }

    return rate;
  } catch (error) {
    logger.error('Failed to fetch exchange rate', { from, to, error });
    return 1; // Fallback: no conversion
  }
}

/**
 * Convert a price from one currency to another.
 * Rounds to 2 decimal places (or 0 for JPY/KRW).
 */
export async function convertPrice(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  const rate = await getRate(from, to);
  const converted = amount * rate;

  // No decimal currencies
  if (['JPY', 'KRW'].includes(to)) {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

/**
 * Format a price with the correct currency symbol.
 */
export function formatPrice(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
