// ============================================================
// Shared Type Definitions for ComSpace Frontend
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accountType?: 'individual' | 'business' | 'association' | 'education';
  avatar?: string;
  phone?: string;
  isVerified?: boolean;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  addresses?: Array<{
    label: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: { lat: number; lng: number };
    isDefault: boolean;
  }>;
  preferences?: {
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  organization?: {
    name: string;
    registrationNumber?: string;
    taxId?: string;
    industry?: string;
    mission?: string;
    estimatedMembers?: number;
    institutionType?: 'primary' | 'secondary' | 'further' | 'higher';
    estimatedStudents?: number;
    urn?: string;
  };
}

export interface Product {
  _id: string;
  name: string;
  slug?: string;
  title?: string;
  description: string;
  shortDescription?: string;
  sku: string;
  category: string;
  basePrice: number;
  price: number;
  salePrice?: number;
  currency: string;
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  stock: number;
  lowStockThreshold?: number;
  isUnlimited?: boolean;
  tags?: string[];
  rating: {
    average: number;
    count: number;
  };
  reviewCount?: number;
  variants?: Array<{
    name: string;
    options: string[];
    priceModifier: number;
  }>;
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
  tenant?: string;
  isActive: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  badge?: 'new' | 'sale' | 'hot' | 'limited' | 'bestseller' | 'featured';
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface Order {
  _id: string;
  items: Array<{
    product: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    currency: string;
    image?: string;
    variant?: string;
  }>;
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  currency: string;
  status: string;
  fulfillmentType: 'delivery' | 'pickup';
  deliveryAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export interface WhiteLabelConfig {
  tenantId: string;
  name: string;
  domain: string;
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  features: Record<string, boolean>;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}
