'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { detectCurrencyFromCountry, setRates } from '@/store/slices/currencySlice';
import apiClient from '@/lib/api';

/**
 * Invisible component that auto-detects the user's currency
 * based on their timezone (client-side, no API call needed)
 * and fetches exchange rates from the backend.
 *
 * Mount once in the root layout inside <Providers>.
 */
export function CurrencyDetector() {
  const dispatch = useAppDispatch();
  const { autoDetected, current } = useAppSelector(state => state.currency);

  useEffect(() => {
    if (autoDetected) return;

    // Detect country from Intl timezone — works without any API call
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "Asia/Shanghai"
      const country = timezoneToCountry(tz);
      if (country) {
        dispatch(detectCurrencyFromCountry(country));
      }
    } catch {
      // Fallback: keep USD
    }
  }, [autoDetected, dispatch]);

  // Fetch exchange rates once on mount and when currency changes
  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      try {
        const res = await apiClient.get(`/currency/rates?base=USD`);
        if (!cancelled && res.data?.data?.rates) {
          dispatch(setRates(res.data.data.rates));
        }
      } catch {
        // Exchange rates unavailable — prices stay in base currency
      }
    }

    fetchRates();
    return () => { cancelled = true; };
  }, [dispatch]);

  return null; // renders nothing
}

/**
 * Map IANA timezone → ISO 3166-1 alpha-2 country code.
 * Covers major timezones. Falls back to undefined.
 */
function timezoneToCountry(tz: string): string | undefined {
  const map: Record<string, string> = {
    // China
    'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN',
    // Japan
    'Asia/Tokyo': 'JP',
    // South Korea
    'Asia/Seoul': 'KR',
    // India
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
    // Pakistan
    'Asia/Karachi': 'PK',
    // Bangladesh
    'Asia/Dhaka': 'BD',
    // Southeast Asia
    'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN',
    'Asia/Jakarta': 'ID', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Singapore': 'SG',
    'Asia/Manila': 'PH', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW',
    // Middle East
    'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Istanbul': 'TR',
    // Russia
    'Europe/Moscow': 'RU',
    // Americas
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
    'Pacific/Honolulu': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
    'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
    'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
    'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO',
    'America/Santiago': 'CL', 'America/Lima': 'PE',
    // Europe
    'Europe/London': 'GB', 'Europe/Dublin': 'IE',
    'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
    'Europe/Vienna': 'AT', 'Europe/Lisbon': 'PT', 'Europe/Athens': 'GR',
    'Europe/Helsinki': 'FI', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK', 'Europe/Zurich': 'CH', 'Europe/Warsaw': 'PL',
    // Africa
    'Africa/Lagos': 'NG', 'Africa/Accra': 'GH', 'Africa/Nairobi': 'KE',
    'Africa/Johannesburg': 'ZA', 'Africa/Cairo': 'EG',
    // Oceania
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
    'Pacific/Auckland': 'NZ',
  };

  return map[tz];
}
