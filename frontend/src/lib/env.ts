import { z } from 'zod';

/**
 * Runtime environment validation for the frontend.
 * Validates that required public env vars are set and well-formed.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .min(1, 'NEXT_PUBLIC_API_URL is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .optional()
    .default(''),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z
    .string()
    .optional()
    .default(''),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .optional()
    .default('https://comspace.app'),
  NEXT_PUBLIC_TENANT_ID: z
    .string()
    .optional()
    .default(''),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID,
  });

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors
    );
    // In production, throw to prevent running with bad config
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables. Check server logs.');
    }
    // In development, return defaults so the app can still start
    return {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: '',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_TENANT_ID: '',
    };
  }

  return parsed.data;
}

export const env = validateEnv();
