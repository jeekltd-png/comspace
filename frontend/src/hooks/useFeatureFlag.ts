'use client';

import { useWhiteLabel, type WhiteLabelConfig } from '@/contexts/WhiteLabelContext';

/**
 * Feature flag names that can be checked.
 */
export type FeatureName =
  | 'products'
  | 'pricing'
  | 'cart'
  | 'checkout'
  | 'delivery'
  | 'pickup'
  | 'reviews'
  | 'wishlist'
  | 'chat'
  | 'socialLogin'
  | 'booking'
  | 'salon';

/**
 * Default feature values when no white-label config exists or a feature isn't
 * explicitly set.  By default everything is ON so the store works out-of-the-box.
 */
const FEATURE_DEFAULTS: Record<FeatureName, boolean> = {
  products: true,
  pricing: true,
  cart: true,
  checkout: true,
  delivery: true,
  pickup: true,
  reviews: true,
  wishlist: true,
  chat: false,
  socialLogin: true,
  booking: false,
  salon: false,
};

/**
 * Check if a single feature is enabled for the current tenant.
 *
 * @example
 *   const cartEnabled = useFeatureFlag('cart');
 *   if (!cartEnabled) return null;
 */
export function useFeatureFlag(feature: FeatureName): boolean {
  const { config, loading } = useWhiteLabel();

  // While loading, return the default (keeps the UI stable)
  if (loading || !config?.features) {
    return FEATURE_DEFAULTS[feature];
  }

  const value = config.features[feature];
  return value !== undefined ? value : FEATURE_DEFAULTS[feature];
}

/**
 * Check multiple features at once.
 *
 * @example
 *   const { cart, checkout, products } = useFeatureFlags('cart', 'checkout', 'products');
 */
export function useFeatureFlags<T extends FeatureName>(
  ...features: T[]
): Record<T, boolean> {
  const { config, loading } = useWhiteLabel();

  const result = {} as Record<T, boolean>;
  for (const feat of features) {
    if (loading || !config?.features) {
      result[feat] = FEATURE_DEFAULTS[feat];
    } else {
      const value = config.features[feat];
      result[feat] = value !== undefined ? value : FEATURE_DEFAULTS[feat];
    }
  }
  return result;
}

/**
 * Preset configurations for common space types.
 */
export const SPACE_PRESETS = {
  'info-only': {
    label: 'Information Only',
    description: 'No products, no shopping — purely informational content',
    icon: '📄',
    features: {
      products: false,
      pricing: false,
      cart: false,
      checkout: false,
      delivery: false,
      pickup: false,
      reviews: false,
      wishlist: false,
      chat: true,
      socialLogin: true,
    },
  },
  showcase: {
    label: 'Showcase',
    description: 'Display services & presence with no shopping cart — upgrade later',
    icon: '🏪',
    features: {
      products: true,
      pricing: true,
      cart: false,
      checkout: false,
      delivery: false,
      pickup: false,
      reviews: true,
      wishlist: true,
      chat: true,
      socialLogin: true,
    },
  },
  catalog: {
    label: 'Product Catalog',
    description: 'Browse products with prices, but no online purchasing',
    icon: '📋',
    features: {
      products: true,
      pricing: true,
      cart: false,
      checkout: false,
      delivery: false,
      pickup: false,
      reviews: true,
      wishlist: true,
      chat: true,
      socialLogin: true,
    },
  },
  'full-store': {
    label: 'Full Store',
    description: 'Complete e-commerce with cart, checkout, and delivery',
    icon: '🛒',
    features: {
      products: true,
      pricing: true,
      cart: true,
      checkout: true,
      delivery: true,
      pickup: true,
      reviews: true,
      wishlist: true,
      chat: false,
      socialLogin: true,
    },
  },
  booking: {
    label: 'Booking / Services',
    description: 'Service listing with pricing but no self-checkout',
    icon: '📅',
    features: {
      products: true,
      pricing: true,
      cart: false,
      checkout: false,
      delivery: false,
      pickup: false,
      reviews: true,
      wishlist: false,
      chat: true,
      socialLogin: true,
      booking: true,
      salon: false,
    },
  },
  salon: {
    label: 'Salon / Spa',
    description: 'Full salon with services, staff, and online appointment booking',
    icon: '💇',
    features: {
      products: true,
      pricing: true,
      cart: true,
      checkout: true,
      delivery: false,
      pickup: false,
      reviews: true,
      wishlist: true,
      chat: true,
      socialLogin: true,
      booking: true,
      salon: true,
    },
  },
  'food-store': {
    label: 'Food Store',
    description: 'Groceries, provisions & food items with delivery & click-and-collect',
    icon: '🍎',
    features: {
      products: true,
      pricing: true,
      cart: true,
      checkout: true,
      delivery: true,
      pickup: true,
      reviews: true,
      wishlist: true,
      chat: false,
      socialLogin: true,
      booking: false,
      salon: false,
    },
  },
  restaurant: {
    label: 'Restaurant',
    description: 'Online food ordering with delivery, pickup & optional table bookings',
    icon: '🍽️',
    features: {
      products: true,
      pricing: true,
      cart: true,
      checkout: true,
      delivery: true,
      pickup: true,
      reviews: true,
      wishlist: false,
      chat: false,
      socialLogin: true,
      booking: true,
      salon: false,
    },
  },
  gym: {
    label: 'Gym & Fitness',
    description: 'Memberships, class timetables, trainer bookings & product sales',
    icon: '🏋️',
    features: {
      products: true,
      pricing: true,
      cart: true,
      checkout: true,
      delivery: false,
      pickup: false,
      reviews: true,
      wishlist: false,
      chat: true,
      socialLogin: true,
      booking: true,
      salon: false,
    },
  },
  pharmacy: {
    label: 'Pharmacy',
    description: 'Health products, prescriptions & delivery',
    icon: '💊',
    features: {
      products: true,
      pricing: true,
      cart: true,
      checkout: true,
      delivery: true,
      pickup: true,
      reviews: true,
      wishlist: true,
      chat: false,
      socialLogin: true,
      booking: false,
      salon: false,
    },
  },
  laundry: {
    label: 'Laundry',
    description: 'Pickup, wash & delivery service management',
    icon: '🧺',
    features: {
      products: true,
      pricing: true,
      cart: true,
      checkout: true,
      delivery: true,
      pickup: true,
      reviews: true,
      wishlist: false,
      chat: false,
      socialLogin: true,
      booking: true,
      salon: false,
    },
  },
  'home-services': {
    label: 'Home Services',
    description: 'Trades & service professionals — bookings, quotes & reviews',
    icon: '🔧',
    features: {
      products: true,
      pricing: true,
      cart: false,
      checkout: false,
      delivery: false,
      pickup: false,
      reviews: true,
      wishlist: false,
      chat: true,
      socialLogin: true,
      booking: true,
      salon: false,
    },
  },
} as const;

export type SpacePreset = keyof typeof SPACE_PRESETS;
