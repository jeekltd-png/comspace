import { z } from 'zod';

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z.string().optional(),
    accountType: z.enum(['individual', 'business', 'association', 'education']),
    sellOnMarketplace: z.boolean().optional().default(false),
    // Space preset hint — vertical shortcuts (salon, food-store, etc.) all use accountType=business
    spacePreset: z.string().optional(),
    orgName: z.string().optional(),
    regNumber: z.string().optional(),
    taxId: z.string().optional(),
    industry: z.string().optional(),
    mission: z.string().optional(),
    estimatedMembers: z.string().optional(),
    // Education-specific fields
    institutionType: z.enum(['primary', 'secondary', 'further', 'higher']).optional(),
    estimatedStudents: z.string().optional(),
    urn: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => data.accountType === 'individual' || (data.orgName && data.orgName.length > 0),
    { message: 'Organization / institution name is required', path: ['orgName'] }
  );
export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Checkout / Shipping Schema ─────────────────────────────────────────────

export const shippingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
});
export type ShippingFormData = z.infer<typeof shippingSchema>;

// ─── Product Schema ─────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.coerce.number().min(0).optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative').default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isUnlimited: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).optional(),
});
export type ProductFormData = z.infer<typeof productSchema>;

// ─── Tenant Schema ──────────────────────────────────────────────────────────

export const tenantSchema = z.object({
  tenantId: z
    .string()
    .min(2, 'Tenant ID must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  name: z.string().min(1, 'Display name is required').max(100),
  domain: z.string().min(1, 'Domain is required'),
  contactEmail: z.string().email('Please enter a valid email'),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  primaryColor: z.string().default('#6C63FF'),
  secondaryColor: z.string().default('#10B981'),
  accentColor: z.string().default('#ec4899'),
  fontFamily: z.string().default('Inter, sans-serif'),
  currencies: z.string().min(1, 'At least one currency is required'),
  paymentMethods: z.string().default('card'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  // Feature flags
  products: z.boolean().default(true),
  pricing: z.boolean().default(true),
  cart: z.boolean().default(true),
  checkout: z.boolean().default(true),
  delivery: z.boolean().default(true),
  pickup: z.boolean().default(true),
  reviews: z.boolean().default(true),
  wishlist: z.boolean().default(true),
  chat: z.boolean().default(false),
  socialLogin: z.boolean().default(true),
});
export type TenantFormData = z.infer<typeof tenantSchema>;

// ─── CMS Page Schema ────────────────────────────────────────────────────────

export const cmsPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  body: z.string().min(1, 'Body content is required'),
  published: z.boolean().default(false),
});
export type CmsPageFormData = z.infer<typeof cmsPageSchema>;

// ─── Association Schema ─────────────────────────────────────────────────────

export const associationSchema = z.object({
  name: z.string().min(1, 'Association name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  category: z.string().optional(),
  contactEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  website: z.string().optional(),
});
export type AssociationFormData = z.infer<typeof associationSchema>;
