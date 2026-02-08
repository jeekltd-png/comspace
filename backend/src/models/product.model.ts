import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  category: mongoose.Types.ObjectId;
  subcategory?: string;
  basePrice: number;
  currency: string;
  prices: Array<{
    currency: string;
    amount: number;
    updatedAt: Date;
  }>;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  stock: number;
  lowStockThreshold: number;
  isUnlimited: boolean;
  dimensions?: {
    weight: number;
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  tags: string[];
  rating: {
    average: number;
    count: number;
  };
  reviews: mongoose.Types.ObjectId[];
  variants?: Array<{
    name: string;
    options: string[];
    priceModifier: number;
  }>;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  tenant: string;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  salePrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subcategory: String,
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    prices: [
      {
        currency: { type: String, required: true },
        amount: { type: Number, required: true },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    isUnlimited: {
      type: Boolean,
      default: false,
    },
    dimensions: {
      weight: Number,
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' },
    },
    tags: [String],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    variants: [
      {
        name: String,
        options: [String],
        priceModifier: { type: Number, default: 0 },
      },
    ],
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    tenant: {
      type: String,
      default: 'default',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    salePrice: Number,
    saleStartDate: Date,
    saleEndDate: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, tenant: 1 });
ProductSchema.index({ sku: 1, tenant: 1 }, { unique: true });
ProductSchema.index({ 'rating.average': -1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ paymentIntentId: 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
